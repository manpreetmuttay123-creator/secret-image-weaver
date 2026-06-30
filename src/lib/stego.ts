// Browser-side AES-GCM + LSB steganography.
// All crypto and pixel work runs locally; nothing is uploaded.

const MAGIC = new Uint8Array([0x53, 0x54, 0x47, 0x31]); // "STG1"
const SALT_LEN = 16;
const IV_LEN = 12;

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 150_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(message: string, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, new TextEncoder().encode(message))
  );
  // payload = MAGIC(4) | SALT(16) | IV(12) | CT
  return concat(MAGIC, salt, iv, ct);
}

export async function decryptPayload(payload: Uint8Array, password: string): Promise<string> {
  if (payload.length < MAGIC.length + SALT_LEN + IV_LEN + 1) throw new Error("Payload too small");
  for (let i = 0; i < MAGIC.length; i++) if (payload[i] !== MAGIC[i]) throw new Error("No hidden message found");
  const salt = payload.slice(4, 4 + SALT_LEN);
  const iv = payload.slice(4 + SALT_LEN, 4 + SALT_LEN + IV_LEN);
  const ct = payload.slice(4 + SALT_LEN + IV_LEN);
  const key = await deriveKey(password, salt);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
    return new TextDecoder().decode(pt);
  } catch {
    throw new Error("Incorrect password or corrupted image");
  }
}

// ---- LSB embed / extract on RGBA pixels ----
// Layout in pixels: 32-bit big-endian length in first 32 RGB channels, then payload bytes.

function setLSB(channel: number, bit: number): number {
  return (channel & 0xfe) | (bit & 1);
}

export function embedBytesIntoImageData(img: ImageData, payload: Uint8Array): ImageData {
  const data = new Uint8ClampedArray(img.data); // copy
  const capacityBits = Math.floor(data.length / 4) * 3; // RGB channels only
  const totalBits = 32 + payload.length * 8;
  if (totalBits > capacityBits) {
    throw new Error(`Image too small. Needs ${Math.ceil(totalBits / 8)} bytes capacity, has ${Math.floor(capacityBits / 8)}.`);
  }
  // Build bit stream: 32-bit length + payload bytes
  const bits: number[] = [];
  const len = payload.length;
  for (let i = 31; i >= 0; i--) bits.push((len >> i) & 1);
  for (const b of payload) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);

  let bi = 0;
  for (let px = 0; px < data.length && bi < bits.length; px += 4) {
    for (let c = 0; c < 3 && bi < bits.length; c++) {
      data[px + c] = setLSB(data[px + c], bits[bi++]);
    }
  }
  return new ImageData(data, img.width, img.height);
}

export function extractBytesFromImageData(img: ImageData): Uint8Array {
  const data = img.data;
  // read 32-bit length
  let len = 0;
  let bi = 0;
  const readBit = (): number => {
    const px = Math.floor(bi / 3) * 4;
    const c = bi % 3;
    bi++;
    return data[px + c] & 1;
  };
  for (let i = 0; i < 32; i++) len = (len << 1) | readBit();
  if (len <= 0 || len > Math.floor(data.length / 4) * 3 / 8) throw new Error("No hidden message found");
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | readBit();
    out[i] = b;
  }
  return out;
}

// ---- File <-> ImageData helpers ----
export async function fileToImageData(file: File): Promise<ImageData> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("Failed to load image"));
      im.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function imageDataToPNGBlob(img: ImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d")!.putImageData(img, 0, 0);
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Failed to encode PNG"))), "image/png")
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
