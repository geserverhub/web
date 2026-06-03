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

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIR_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;

function findZipEocd(buffer) {
  const minOffset = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minOffset; i--) {
    if (buffer.readUInt32LE(i) === ZIP_EOCD_SIGNATURE) return i;
  }
  return -1;
}

function decodeZipEntryData(buffer, localOffset, compSize, method) {
  if (localOffset + 30 > buffer.length) return null;
  if (buffer.readUInt32LE(localOffset) !== ZIP_LOCAL_FILE_SIGNATURE) return null;

  const nameLen = buffer.readUInt16LE(localOffset + 26);
  const extraLen = buffer.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + nameLen + extraLen;
  if (compSize <= 0 || dataStart + compSize > buffer.length) return null;

  const compData = buffer.subarray(dataStart, dataStart + compSize);
  if (method === 0) return compData;
  if (method === 8) {
    try {
      return inflateRawSync(compData);
    } catch {
      return null;
    }
  }
  return null;
}

/** Read zip entries via central directory (handles AAB data-descriptor entries). */
function readZipStoredEntry(buffer) {
  const eocdOffset = findZipEocd(buffer);
  if (eocdOffset < 0) return readZipStoredEntrySequential(buffer);

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (centralDirOffset + centralDirSize > buffer.length) return [];

  const entries = [];
  let offset = centralDirOffset;

  for (let i = 0; i < entryCount && offset + 46 <= buffer.length; i++) {
    if (buffer.readUInt32LE(offset) !== ZIP_CENTRAL_DIR_SIGNATURE) break;

    const method = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLen).toString("utf8");

    const data = decodeZipEntryData(buffer, localOffset, compSize, method);
    if (data) entries.push({ name, data });

    offset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

/** Legacy sequential scan — fallback when EOCD is missing. */
function readZipStoredEntrySequential(buffer) {
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
const RES_XML_TYPE = 0x00080003;
const RES_STRING_POOL_TYPE = 0x001c0001;
const RES_XML_START_ELEMENT_TYPE = 0x00100102;
const RES_VALUE_TYPE_STRING = 0x03;

function looksLikePackageName(value) {
  if (!value || value.length < 3 || value.length > 128) return false;
  if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(value)) return false;
  const parts = value.split(".");
  if (parts.some((part) => part.length < 2)) return false;
  const lower = value.toLowerCase();
  if (PACKAGE_SKIP_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;
  if (lower.includes("manifest") || lower.includes("permission") || lower.includes("intent")) return false;
  return true;
}

function scorePackageName(value) {
  if (!looksLikePackageName(value)) return -1;
  const parts = value.split(".");
  const tlds = new Set(["com", "org", "net", "io", "dev", "app"]);
  const last = parts[parts.length - 1].toLowerCase();
  if (tlds.has(last) && parts.length === 2 && parts[0].length <= 2) return -1;
  return parts.length * 100 + value.length;
}

function pickBestPackageCandidate(candidates) {
  let best = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = scorePackageName(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function readUtf8PoolString(buffer, pos) {
  let p = pos;
  let charLen = buffer[p++];
  if (charLen & 0x80) {
    charLen = ((charLen & 0x7f) << 8) | buffer[p++];
  }
  let byteLen = buffer[p++];
  if (byteLen & 0x80) {
    byteLen = ((byteLen & 0x7f) << 8) | buffer[p++];
  }
  if (p + byteLen > buffer.length) return "";
  return buffer.subarray(p, p + byteLen).toString("utf8");
}

function readUtf16PoolString(buffer, pos) {
  if (pos + 2 > buffer.length) return "";
  const charLen = buffer.readUInt16LE(pos);
  const end = pos + 2 + charLen * 2;
  if (end > buffer.length) return "";
  return buffer.subarray(pos + 2, end).toString("utf16le");
}

function parseAxmlStringPool(manifestBuffer) {
  if (manifestBuffer.length < 8) return [];
  if (manifestBuffer.readUInt32LE(0) !== RES_XML_TYPE) return [];

  let offset = manifestBuffer.readUInt16LE(4);
  while (offset + 8 <= manifestBuffer.length) {
    const chunkType = manifestBuffer.readUInt32LE(offset);
    const chunkSize = manifestBuffer.readUInt32LE(offset + 4);
    if (chunkSize < 8 || offset + chunkSize > manifestBuffer.length) break;

    if (chunkType === RES_STRING_POOL_TYPE) {
      const headerSize = manifestBuffer.readUInt16LE(offset + 2);
      const stringCount = manifestBuffer.readUInt32LE(offset + 8);
      const flags = manifestBuffer.readUInt32LE(offset + 16);
      const stringsStart = manifestBuffer.readUInt32LE(offset + 20);
      const isUtf8 = (flags & (1 << 8)) !== 0;
      const offsetsStart = offset + headerSize;
      const stringsBase = offset + stringsStart;
      const strings = [];

      for (let i = 0; i < stringCount; i++) {
        const relOffset = manifestBuffer.readUInt32LE(offsetsStart + i * 4);
        const pos = stringsBase + relOffset;
        if (pos >= manifestBuffer.length) {
          strings.push("");
          continue;
        }
        try {
          strings.push(isUtf8 ? readUtf8PoolString(manifestBuffer, pos) : readUtf16PoolString(manifestBuffer, pos));
        } catch {
          strings.push("");
        }
      }
      return strings;
    }

    offset += chunkSize;
  }
  return [];
}

function packageNameFromManifestAttributes(manifestBuffer, strings) {
  let offset = manifestBuffer.readUInt16LE(4);

  while (offset + 8 <= manifestBuffer.length) {
    const chunkType = manifestBuffer.readUInt32LE(offset);
    const chunkSize = manifestBuffer.readUInt32LE(offset + 4);
    if (chunkSize < 8 || offset + chunkSize > manifestBuffer.length) break;

    if (chunkType === RES_XML_START_ELEMENT_TYPE) {
      const attrCount = manifestBuffer.readUInt16LE(offset + 28);
      let attrOffset = offset + 32;

      for (let i = 0; i < attrCount; i++) {
        const attrNameIdx = manifestBuffer.readUInt32LE(attrOffset + 4);
        const rawValueIdx = manifestBuffer.readUInt32LE(attrOffset + 8);
        const typedValueType = manifestBuffer.readUInt8(attrOffset + 15);
        const typedValueData = manifestBuffer.readUInt32LE(attrOffset + 16);
        const attrName = strings[attrNameIdx];

        if (attrName === "package") {
          let pkg = null;
          if (typedValueType === RES_VALUE_TYPE_STRING && rawValueIdx >= 0 && rawValueIdx < strings.length) {
            pkg = strings[rawValueIdx];
          } else if (rawValueIdx >= 0 && rawValueIdx < strings.length) {
            pkg = strings[rawValueIdx];
          } else if (typedValueType === RES_VALUE_TYPE_STRING && typedValueData < strings.length) {
            pkg = strings[typedValueData];
          }
          if (pkg && looksLikePackageName(pkg)) return pkg;
        }

        attrOffset += 20;
      }
    }

    offset += chunkSize;
  }
  return null;
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

function isAxmlManifest(manifestBuffer) {
  return manifestBuffer.length >= 4 && manifestBuffer.readUInt32LE(0) === RES_XML_TYPE;
}

function readProtobufLength(buffer, pos) {
  let len = buffer[pos];
  let bytesRead = 1;
  if (len & 0x80) {
    len = ((len & 0x7f) << 8) | buffer[pos + 1];
    bytesRead = 2;
  }
  return { len, bytesRead };
}

/** AGP/bundletool protobuf AndroidManifest (base/manifest/AndroidManifest.xml). */
function packageNameFromProtobufManifest(manifestBuffer) {
  const marker = Buffer.from("package");
  let searchFrom = 0;

  while (searchFrom < manifestBuffer.length) {
    const idx = manifestBuffer.indexOf(marker, searchFrom);
    if (idx === -1) break;

    let pos = idx + marker.length;
    if (pos < manifestBuffer.length && manifestBuffer[pos] === 0x1a) {
      pos += 1;
      if (pos >= manifestBuffer.length) break;
      const { len, bytesRead } = readProtobufLength(manifestBuffer, pos);
      pos += bytesRead;
      if (pos + len <= manifestBuffer.length) {
        const value = manifestBuffer.subarray(pos, pos + len).toString("utf8");
        if (looksLikePackageName(value)) return value;
      }
    }

    searchFrom = idx + 1;
  }

  return null;
}

/** Read applicationId / package name from .apk or .aab buffer. */
export function packageNameFromAndroidArchive(buffer) {
  const entries = readZipStoredEntry(buffer);
  const manifest = findAndroidManifest(entries);
  if (!manifest?.data) return null;

  const manifestData = manifest.data;

  if (isAxmlManifest(manifestData)) {
    const strings = parseAxmlStringPool(manifestData);
    if (strings.length) {
      const fromAttribute = packageNameFromManifestAttributes(manifestData, strings);
      if (fromAttribute) return fromAttribute;

      const fromPool = pickBestPackageCandidate(strings);
      if (fromPool) return fromPool;
    }
  } else {
    const fromProtobuf = packageNameFromProtobufManifest(manifestData);
    if (fromProtobuf) return fromProtobuf;
  }

  return pickBestPackageCandidate(packageNameCandidatesFromManifest(manifestData));
}

export function hashMetaForBuffer(buffer, { isAndroidSigningArchive = false } = {}) {
  const sha1 = sha1Formatted(buffer);
  const signingSha1 = isAndroidSigningArchive ? signingSha1FromAndroidBundle(buffer) : null;
  const packageName = isAndroidSigningArchive ? packageNameFromAndroidArchive(buffer) : null;
  return { sha1, signingSha1, packageName };
}
