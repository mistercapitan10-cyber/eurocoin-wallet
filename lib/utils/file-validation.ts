const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES_PER_REQUEST = 5;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function validateFileName(fileName: string): string | null {
  // Remove path components
  const sanitized = fileName
    .replace(/^.*[/\\]/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 255);

  return sanitized || null;
}

export function validateFile(
  fileName: string,
  fileType: string,
  fileSize: number,
): FileValidationResult {
  // Check type
  if (!validateFileType(fileType)) {
    return { valid: false, error: `File type ${fileType} is not allowed` };
  }

  // Check size
  if (!validateFileSize(fileSize)) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check filename
  const sanitized = validateFileName(fileName);
  if (!sanitized) {
    return { valid: false, error: `Invalid filename: ${fileName}` };
  }

  return { valid: true };
}

export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

export function getMaxFilesPerRequest(): number {
  return MAX_FILES_PER_REQUEST;
}

