import { createHash, X509Certificate } from "crypto";
import { inflateRawSync } from "zlib";

/** SHA-1 of file bytes — format AA:BB:CC:... */
export function sha1Formatted(buffer) {
  const hex = createHash("sha1").update(buffer).digest("hex").toUpperCase();
  return hex.match(/.{1,2}/g).join(":");
}

export function sha1Plain(buffer) {
  return createHash("sha1").update(buffer).digest("hex").toUpperCase();
}

function readZipStoredEntry(buffer) {
  const entries = [];
  let offset = 0;
  while (offset + 30 < buffer.length) {
    if (
      buffer[offset] !== 0x50 ||
      buffer[offset + 1] !== 0x4b ||
      buffer[offset + 2] !== 0x03 ||
      buffer[offset + 3] !== 0x04
    ) {
      offset += 1;
      continue;
    }
    const method = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    const compData = buffer.subarray(dataStart, dataStart + compSize);
    let data = compData;
    if (method === 8) {
      try {
        data = inflateRawSync(compData);
      } catch {
        data = null;
      }
    } else if (method !== 0) {
      data = null;
    }
    if (data) entries.push({ name, data });
    offset = dataStart + compSize;
  }
  return entries;
}

function certFromPkcs7Der(pkcs7) {
  for (let i = 0; i < pkcs7.length - 4; i++) {
    if (pkcs7[i] !== 0x30) continue;
    const lenByte = pkcs7[i + 1];
    let len = 0;
    let headerSize = 2;
    if (lenByte === 0x82) {
      len = pkcs7.readUInt16BE(i + 2);
      headerSize = 4;
    } else if (lenByte === 0x81) {
      len = pkcs7[i + 2];
      headerSize = 3;
    } else if (lenByte < 0x80) {
      len = lenByte;
    } else {
      continue;
    }
    const total = headerSize + len;
    if (total < 64 || i + total > pkcs7.length) continue;
    try {
      return new X509Certificate(pkcs7.subarray(i, i + total));
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Extract upload/signing certificate SHA-1 from .aab / .apk zip buffer. */
export function signingSha1FromAndroidBundle(buffer) {
  const entries = readZipStoredEntry(buffer);
  const sig = entries.find(
    (e) =>
      e.name.startsWith("META-INF/") &&
      (e.name.endsWith(".RSA") || e.name.endsWith(".EC") || e.name.endsWith(".DSA"))
  );
  if (!sig) return null;
  const cert = certFromPkcs7Der(sig.data);
  if (!cert) return null;
  return cert.fingerprint.toUpperCase();
}

function findAndroidManifest(entries) {
  return entries.find(
    (e) =>
      e.name === "AndroidManifest.xml" ||
      e.name === "base/manifest/AndroidManifest.xml" ||
      e.name.endsWith("/AndroidManifest.xml")
  );
}

const PACKAGE_SKIP_PREFIXES = ["android.", "androidx.", "com.android.", "java.", "kotlin.", "http"];

function looksLikePackageName(value) {
  if (!value || value.length < 3 || value.length > 128) return false;
  if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(value)) return false;
  const lower = value.toLowerCase();
  if (PACKAGE_SKIP_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;
  if (lower.includes("manifest") || lower.includes("permission") || lower.includes("intent")) return false;
  return true;
}

function packageNameCandidatesFromManifest(manifestBuffer) {
  const candidates = new Set();
  for (let i = 0; i < manifestBuffer.length - 4; i++) {
    const start = manifestBuffer[i];
    if (start < 0x61 || start > 0x7a) continue;
    let j = i;
    while (j < manifestBuffer.length) {
      const c = manifestBuffer[j];
      if (
        (c >= 0x61 && c <= 0x7a) ||
        (c >= 0x41 && c <= 0x5a) ||
        (c >= 0x30 && c <= 0x39) ||
        c === 0x2e ||
        c === 0x5f
      ) {
        j += 1;
        continue;
      }
      break;
    }
    if (j - i < 5) continue;
    const value = manifestBuffer.subarray(i, j).toString("ascii");
    if (looksLikePackageName(value)) candidates.add(value);
  }
  return [...candidates];
}

/** Read applicationId / package name from .apk or .aab buffer. */
export function packageNameFromAndroidArchive(buffer) {
  const entries = readZipStoredEntry(buffer);
  const manifest = findAndroidManifest(entries);
  if (!manifest?.data) return null;

  const candidates = packageNameCandidatesFromManifest(manifest.data);
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const segA = a.split(".").length;
    const segB = b.split(".").length;
    if (segA !== segB) return segA - segB;
    return a.length - b.length;
  });

  return candidates[0];
}

export function hashMetaForBuffer(buffer, { isAndroidSigningArchive = false } = {}) {
  const sha1 = sha1Formatted(buffer);
  const signingSha1 = isAndroidSigningArchive ? signingSha1FromAndroidBundle(buffer) : null;
  const packageName = isAndroidSigningArchive ? packageNameFromAndroidArchive(buffer) : null;
  return { sha1, signingSha1, packageName };
}
