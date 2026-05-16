import fs from "fs"
import path from "path"

const UPLOADS_DIR = path.join(process.cwd(), "uploads")

export type StorageCategory = "contracts" | "proofs" | "ktp" | "collateral"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_MIME_TYPES: Record<StorageCategory, string[]> = {
  contracts: ["application/pdf"],
  proofs: ["image/jpeg", "image/png", "image/webp"],
  ktp: ["image/jpeg", "image/png", "image/webp"],
  collateral: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
}

const MAGIC_BYTES: Record<string, { offset: number; bytes: Buffer }[]> = {
  "image/jpeg": [{ offset: 0, bytes: Buffer.from([0xFF, 0xD8, 0xFF]) }],
  "image/png": [{ offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47]) }],
  "application/pdf": [{ offset: 0, bytes: Buffer.from([0x25, 0x50, 0x44, 0x46]) }],
  "image/webp": [{ offset: 0, bytes: Buffer.from([0x52, 0x49, 0x46, 0x46]) }],
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const patterns = MAGIC_BYTES[mimeType]
  if (!patterns) return true // No magic bytes defined, skip validation

  return patterns.some(({ offset, bytes }) => {
    if (buffer.length < offset + bytes.length) return false
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[offset + i] !== bytes[i]) return false
    }
    return true
  })
}

export interface FileUpload {
  name: string
  type: string
  size: number
  arrayBuffer: () => Promise<ArrayBuffer>
}

export function validateFile(category: StorageCategory, file: FileUpload): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }

  const allowed = ALLOWED_MIME_TYPES[category]
  if (!allowed.includes(file.type)) {
    return { valid: false, error: `Tipe file tidak diizinkan. Hanya ${allowed.join(", ")}` }
  }

  return { valid: true }
}

export async function validateFileContent(file: FileUpload): Promise<{ valid: boolean; error?: string; mimeType?: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())

  let detectedMimeType: string | null = null
  for (const [mimeType, patterns] of Object.entries(MAGIC_BYTES)) {
    if (validateMagicBytes(buffer, mimeType)) {
      detectedMimeType = mimeType
      break
    }
  }

  if (detectedMimeType && detectedMimeType !== file.type) {
    return { valid: false, error: `Konten file tidak sesuai dengan tipe yang diklaim` }
  }

  return { valid: true, mimeType: detectedMimeType ?? file.type }
}

function ensureDir(category: StorageCategory): string {
  const dir = path.join(UPLOADS_DIR, category)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export async function saveFile(category: StorageCategory, file: FileUpload, prefix: string): Promise<string> {
  const dir = ensureDir(category)
  const ext = file.name.split(".").pop() || "bin"
  const filename = `${prefix}-${Date.now()}.${ext}`
  const filePath = path.join(dir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.promises.writeFile(filePath, buffer)

  return `/uploads/${category}/${filename}`
}

export async function deleteFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return

  const filePath = path.join(process.cwd(), url.replace(/^\//, ""))
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath).catch(() => {})
  }
}

export function fileExists(url: string): boolean {
  if (!url.startsWith("/uploads/")) return false
  const filePath = path.join(process.cwd(), url.replace(/^\//, ""))
  return fs.existsSync(filePath)
}
