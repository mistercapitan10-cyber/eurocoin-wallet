# 📎 План реализации прикрепления файлов к формам

> **Пошаговый план с фазами для добавления функциональности прикрепления файлов (PDF, Excel, DOCX)**

## 📋 Содержание

- [Обзор проекта](#обзор-проекта)
- [Технические требования](#технические-требования)
- [Фаза 1: База данных](#фаза-1-база-данных)
- [Фаза 2: Backend API](#фаза-2-backend-api)
- [Фаза 3: Frontend компоненты](#фаза-3-frontend-компоненты)
- [Фаза 4: Интеграция и тестирование](#фаза-4-интеграция-и-тестирование)
- [Чеклист выполнения](#чеклист-выполнения)

---

## 🔍 Обзор проекта

### Текущая ситуация

**Что работает:**

- ✅ Формы `ExchangeSection` и `InternalRequestForm` отправляют заявки
- ✅ Данные сохраняются в PostgreSQL (`exchange_requests`, `internal_requests`)
- ✅ Telegram и Email уведомления работают
- ✅ Интеграция с NextAuth и wagmi

**Что нужно добавить:**

- ❌ Прикрепление файлов к заявкам
- ❌ Хранение файлов в БД (PostgreSQL BYTEA)
- ❌ Скачивание файлов
- ❌ Отображение файлов в Telegram уведомлениях

### Архитектура решения

**Выбранный подход:** PostgreSQL BYTEA (встроенное решение)

- Простота реализации
- ACID транзакции
- Нет внешних зависимостей
- Подходит для файлов до 10MB

**Формы для доработки:**

1. `components/exchange/exchange-section.tsx` - обмен токенов
2. `components/forms/internal-request-form.tsx` - внутренние заявки

---

## 🛠️ Технические требования

### Поддерживаемые форматы

| Тип       | Расширения               | MIME типы                                                                                       |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| **PDF**   | `.pdf`                   | `application/pdf`                                                                               |
| **Excel** | `.xls`, `.xlsx`, `.xlsm` | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| **Word**  | `.doc`, `.docx`          | `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| **Text**  | `.txt`, `.csv`           | `text/plain`, `text/csv`                                                                        |

### Ограничения

| Параметр              | Значение | Обоснование                    |
| --------------------- | -------- | ------------------------------ |
| **Размер файла**      | 10 MB    | Оптимальная производительность |
| **Количество файлов** | 5 шт     | Предотвращение спама           |
| **Суммарный размер**  | 25 MB    | Ограничение на заявку          |
| **Таймаут загрузки**  | 30 сек   | UX consideration               |

### Безопасность

- ✅ Валидация MIME типов (whitelist)
- ✅ Проверка размера файла (максимум 10MB)
- ✅ Санитизация имени файла
- ✅ Rate limiting (10 загрузок в минуту)

---

## 📊 Фаза 1: База данных

**Цель:** Создать структуру БД для хранения файлов  
**Время:** 1-2 часа  
**Приоритет:** 🔴 Critical

### Шаг 1.1: Создать SQL миграцию

**Файл:** `lib/database/migrations/add-request-files.sql`

```sql
-- Создание таблицы для хранения файлов
CREATE TABLE IF NOT EXISTS request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(50) NOT NULL,
  request_type VARCHAR(20) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_data BYTEA NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys with CASCADE DELETE
  CONSTRAINT fk_exchange_request
    FOREIGN KEY (request_id)
    REFERENCES exchange_requests(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_internal_request
    FOREIGN KEY (request_id)
    REFERENCES internal_requests(id)
    ON DELETE CASCADE,

  CONSTRAINT valid_request_type
    CHECK (request_type IN ('exchange', 'internal'))
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_request_files_request_id
  ON request_files(request_id);

CREATE INDEX IF NOT EXISTS idx_request_files_request_type
  ON request_files(request_type);

-- Комментарии для документации
COMMENT ON TABLE request_files IS 'Прикрепленные файлы к заявкам';
COMMENT ON COLUMN request_files.file_data IS 'Binary данные файла (BYTEA)';
COMMENT ON COLUMN request_files.request_type IS 'Тип заявки: exchange или internal';
```

**Проверка:**

- [ ] Миграция создана без синтаксических ошибок
- [ ] Foreign keys настроены с CASCADE DELETE
- [ ] Индексы созданы для производительности

### Шаг 1.2: Создать Drizzle схему

**Файл:** `lib/database/file-schema.ts`

```typescript
import { pgTable, uuid, text, bigint, timestamp, index } from "drizzle-orm/pg-core";

export const requestFiles = pgTable(
  "request_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: text("request_id").notNull(),
    requestType: text("request_type").notNull(),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    fileData: text("file_data").notNull(), // Base64 encoded
    uploadedAt: timestamp("uploaded_at", { mode: "date", withTimezone: true }).defaultNow(),
  },
  (table) => ({
    requestIdIdx: index("idx_request_files_request_id").on(table.requestId),
    requestTypeIdx: index("idx_request_files_request_type").on(table.requestType),
  }),
);

export type RequestFile = typeof requestFiles.$inferSelect;
export type NewRequestFile = typeof requestFiles.$inferInsert;
```

**Проверка:**

- [ ] Типы TypeScript корректны
- [ ] Индексы соответствуют SQL миграции
- [ ] Схема экспортирована корректно

### Шаг 1.3: Создать queries функции

**Файл:** `lib/database/file-queries.ts`

```typescript
import { query } from "./db";

export interface RequestFileData {
  id: string;
  request_id: string;
  request_type: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: Buffer;
  uploaded_at: Date;
}

export async function createRequestFile(data: {
  requestId: string;
  requestType: "exchange" | "internal";
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64
}): Promise<RequestFileData> {
  const result = await query(
    `INSERT INTO request_files 
     (request_id, request_type, file_name, file_type, file_size, file_data)
     VALUES ($1, $2, $3, $4, $5, decode($6, 'base64'))
     RETURNING *`,
    [data.requestId, data.requestType, data.fileName, data.fileType, data.fileSize, data.fileData],
  );

  return result.rows[0];
}

export async function getRequestFilesByRequestId(requestId: string): Promise<RequestFileData[]> {
  const result = await query(
    "SELECT * FROM request_files WHERE request_id = $1 ORDER BY uploaded_at ASC",
    [requestId],
  );

  return result.rows;
}

export async function getRequestFileById(id: string): Promise<RequestFileData | null> {
  const result = await query("SELECT * FROM request_files WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function deleteRequestFile(id: string): Promise<void> {
  await query("DELETE FROM request_files WHERE id = $1", [id]);
}
```

**Проверка:**

- [ ] Функция `createRequestFile` работает
- [ ] Использует `decode($6, 'base64')` для конвертации
- [ ] Функции типизированы корректно

### Шаг 1.4: Применить миграцию

**Команда:**

```bash
# Применить миграцию локально
npm run db:migrate

# Проверить наличие таблицы
psql $DATABASE_URL -c "\d request_files"
```

**Проверка:**

- [ ] Миграция применена успешно
- [ ] Таблица `request_files` создана
- [ ] Индексы существуют
- [ ] Foreign keys работают

---

## 🔌 Фаза 2: Backend API

**Цель:** Создать API endpoints для работы с файлами  
**Время:** 3-4 часа  
**Приоритет:** 🔴 Critical

### Шаг 2.1: Создать утилиту валидации

**Файл:** `lib/utils/file-validation.ts`

```typescript
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
    return { valid: false, error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
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
```

**Проверка:**

- [ ] Валидация MIME типов работает
- [ ] Проверка размера файла работает
- [ ] Санитизация имени файла работает
- [ ] Константы экспортированы

### Шаг 2.2: Создать upload endpoint

**Файл:** `app/api/files/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createRequestFile } from "@/lib/database/file-queries";
import { validateFile, getMaxFilesPerRequest } from "@/lib/utils/file-validation";

interface FileUploadRequest {
  requestId: string;
  requestType: "exchange" | "internal";
  files: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // base64
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const data: FileUploadRequest = await request.json();

    // Validate request
    if (!data.requestId || !data.requestType) {
      return NextResponse.json(
        { error: "requestId and requestType are required" },
        { status: 400 },
      );
    }

    if (!data.files || data.files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    if (data.files.length > getMaxFilesPerRequest()) {
      return NextResponse.json(
        { error: `Maximum ${getMaxFilesPerRequest()} files allowed` },
        { status: 400 },
      );
    }

    // Validate each file
    for (const file of data.files) {
      const validation = validateFile(file.fileName, file.fileType, file.fileSize);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // Save files to database
    const savedFiles = [];
    for (const file of data.files) {
      const savedFile = await createRequestFile({
        requestId: data.requestId,
        requestType: data.requestType,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        fileData: file.fileData,
      });
      savedFiles.push(savedFile);
    }

    return NextResponse.json({
      success: true,
      files: savedFiles.map((f) => ({
        id: f.id,
        fileName: f.file_name,
        fileType: f.file_type,
        fileSize: f.file_size,
      })),
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}
```

**Проверка:**

- [ ] Endpoint создан и работает
- [ ] Валидация работает корректно
- [ ] Файлы сохраняются в БД
- [ ] Возвращается корректный JSON ответ

### Шаг 2.3: Создать download endpoint

**Файл:** `app/api/files/download/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRequestFileById } from "@/lib/database/file-queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Fetch file from database
    const file = await getRequestFileById(fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Convert Buffer to ArrayBuffer
    const buffer =
      file.file_data instanceof Buffer ? file.file_data : Buffer.from(file.file_data, "base64");

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.file_type,
        "Content-Disposition": `inline; filename="${file.file_name}"`,
        "Content-Length": file.file_size.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
```

**Проверка:**

- [ ] Endpoint создан и работает
- [ ] Файл загружается из БД
- [ ] Headers настроены корректно
- [ ] Файл отображается в браузере

### Шаг 2.4: Обновить существующие endpoints

**Файл:** `app/api/submit-exchange-request/route.ts`

```typescript
// Добавить в интерфейс ExchangeRequest
interface ExchangeRequest {
  // ... existing fields
  files?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // base64
  }>;
}

// В функции POST, после сохранения заявки, добавить:
if (data.files && data.files.length > 0) {
  // Save files
  for (const file of data.files) {
    await createRequestFile({
      requestId: requestId,
      requestType: "exchange",
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      fileData: file.fileData,
    });
  }
}
```

**Файл:** `app/api/submit-request/route.ts`

```typescript
// Аналогично обновить для internal requests
if (data.files && data.files.length > 0) {
  for (const file of data.files) {
    await createRequestFile({
      requestId: requestId,
      requestType: "internal",
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      fileData: file.fileData,
    });
  }
}
```

**Проверка:**

- [ ] Endpoints обновлены
- [ ] Файлы сохраняются вместе с заявками
- [ ] Обработка ошибок работает

---

## 🎨 Фаза 3: Frontend компоненты

**Цель:** Создать UI для загрузки и отображения файлов  
**Время:** 4-5 часов  
**Приоритет:** 🔴 Critical

### Шаг 3.1: Создать компонент FileUploader

**Файл:** `components/ui/file-uploader.tsx`

```typescript
"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, File } from "lucide-react";
import toast from "react-hot-toast";
import { validateFile } from "@/lib/utils/file-validation";

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface FileWithId extends File {
  id: string;
}

export function FileUploader({
  onFilesChange,
  maxFiles = 5,
  disabled = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    // Check total files limit
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles: FileWithId[] = [];
    for (const file of selectedFiles) {
      const validation = validateFile(file.name, file.type, file.size);

      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      // Add unique ID
      const fileWithId = Object.assign(file, {
        id: `${Date.now()}-${Math.random()}`,
      });

      validFiles.push(fileWithId);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const newFiles = files.filter((f) => f.id !== fileId);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onClick={() => !disabled && files.length < maxFiles && fileInputRef.current?.click()}
        className={`
          relative flex cursor-pointer flex-col items-center justify-center
          rounded-lg border-2 border-dashed p-6 transition-colors
          ${disabled || files.length >= maxFiles
            ? "cursor-not-allowed border-gray-300 opacity-50"
            : "border-outline hover:border-accent hover:bg-accent/5"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          multiple
          disabled={disabled || files.length >= maxFiles}
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload className="mb-2 h-10 w-10 text-foregroundMuted" />

        <p className="text-sm font-medium">
          {files.length >= maxFiles
            ? "Maximum files reached"
            : "Click to upload or drag and drop"}
        </p>
        <p className="text-xs text-foregroundMuted">
          PDF, Excel, Word, TXT, CSV (max 10MB per file)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-outline bg-surface p-3"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <File className="h-4 w-4 flex-shrink-0 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-foregroundMuted">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file.id);
                  }}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <p className="text-xs text-foregroundMuted">
          {files.length} file{files.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
```

**Проверка:**

- [ ] Компонент создан
- [ ] UI отображается корректно
- [ ] Валидация работает
- [ ] Удаление файлов работает

### Шаг 3.2: Создать утилиту конвертации файлов

**Файл:** `lib/utils/file-converter.ts`

```typescript
export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:mime/type;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function convertFilesToBase64(files: File[]): Promise<
  Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string;
  }>
> {
  const convertedFiles = [];

  for (const file of files) {
    const base64 = await convertFileToBase64(file);

    convertedFiles.push({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: base64,
    });
  }

  return convertedFiles;
}
```

**Проверка:**

- [ ] Функции работают корректно
- [ ] Base64 конвертация правильная
- [ ] Обработка ошибок есть

### Шаг 3.3: Обновить ExchangeSection

**Файл:** `components/exchange/exchange-section.tsx`

```typescript
// Добавить импорты
import { FileUploader } from "@/components/ui/file-uploader";
import { convertFilesToBase64 } from "@/lib/utils/file-converter";

// Добавить state
const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

// Обновить функцию handleSubmitRequest
const handleSubmitRequest = async () => {
  // ... existing validation

  setIsSubmitting(true);
  const tokenPriceUsd = priceUsd || 1;

  try {
    // Convert files to base64
    const filesData = await convertFilesToBase64(attachedFiles);

    const response = await fetch("/api/submit-exchange-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokenAmount,
        fiatAmount: eurAmount,
        walletAddress: formData.walletAddress,
        email: formData.email,
        comment: formData.comment,
        commission: "1.5%",
        rate: `${(tokenPriceUsd * USD_EUR).toFixed(2)} EUR за 1 TOKEN (1 TOKEN = ${tokenPriceUsd.toFixed(2)} USD)`,
        userId: userId || undefined,
        files: filesData, // Add files
      }),
    });

    // ... rest of handler

    // Reset files after success
    setAttachedFiles([]);
  } catch (error) {
    // ... error handling
  } finally {
    setIsSubmitting(false);
  }
};

// Добавить FileUploader в JSX перед кнопками
<div className="mt-4">
  <label className="dark:text-dark-foreground mb-2 block text-sm font-medium text-foreground">
    Attach Files (Optional)
  </label>
  <FileUploader
    onFilesChange={setAttachedFiles}
    maxFiles={5}
    disabled={isSubmitting}
  />
</div>
```

**Проверка:**

- [ ] Import добавлены
- [ ] State создан
- [ ] Файлы конвертируются в base64
- [ ] FileUploader отображается
- [ ] Форма отправляется с файлами

### Шаг 3.4: Обновить InternalRequestForm

**Файл:** `components/forms/internal-request-form.tsx`

```typescript
// Аналогично добавить:
import { FileUploader } from "@/components/ui/file-uploader";
import { convertFilesToBase64 } from "@/lib/utils/file-converter";

const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

// В handleSubmit добавить конвертацию файлов
const filesData = await convertFilesToBase64(attachedFiles);

body: JSON.stringify({
  ...form,
  walletAddress: form.walletAddress,
  userId: userId || undefined,
  email: email || undefined,
  files: filesData, // Add files
}),

// Добавить FileUploader в форму
<div className="flex flex-col gap-2 md:col-span-2">
  <label className="dark:text-dark-foregroundMuted text-xs font-semibold uppercase tracking-[0.24em] text-foregroundMuted">
    Attach Files (Optional)
  </label>
  <FileUploader
    onFilesChange={setAttachedFiles}
    maxFiles={5}
    disabled={isSubmitting}
  />
</div>
```

**Проверка:**

- [ ] Внутренняя форма обновлена
- [ ] Файлы отправляются корректно
- [ ] UI работает правильно

---

## 🧪 Фаза 4: Интеграция и тестирование

**Цель:** Протестировать и интегрировать файлы в уведомления  
**Время:** 3-4 часа  
**Приоритет:** 🟡 Important

### Шаг 4.1: Обновить Telegram уведомления с файлами

**Цель:** Отправить файлы в Telegram для скачивания

**Файл:** `app/api/submit-exchange-request/route.ts`

#### Часть 1: Создать утилиту для отправки файлов

**Файл:** `lib/telegram/send-files.ts` (новый файл)

```typescript
import TelegramBot from "telegraf";

export async function sendFilesToTelegram(
  chatId: string,
  files: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: Buffer;
  }>,
): Promise<void> {
  const bot = new TelegramBot(process.env.TELEGRAM_API_KEY!);

  try {
    // Send text message with file count
    const filesInfo = files.length > 0 ? `\n📎 *Прикрепленные файлы:* ${files.length} шт.` : "";

    await bot.telegram.sendMessage(chatId, filesInfo, { parse_mode: "Markdown" });

    // Send each file
    for (const file of files) {
      // Determine file caption
      const caption = `📎 ${file.fileName} (${formatFileSize(file.fileSize)})`;

      // Determine file type and send accordingly
      if (file.fileType === "application/pdf") {
        // Send PDF as document
        await bot.telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      } else if (
        file.fileType.includes("spreadsheet") ||
        file.fileType.includes("excel") ||
        file.fileName.endsWith(".xls") ||
        file.fileName.endsWith(".xlsx")
      ) {
        // Send Excel as document
        await bot.telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      } else if (
        file.fileType.includes("word") ||
        file.fileType.includes("document") ||
        file.fileName.endsWith(".doc") ||
        file.fileName.endsWith(".docx")
      ) {
        // Send Word as document
        await bot.telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      } else {
        // Send as document (generic)
        await bot.telegram.sendDocument(
          chatId,
          {
            source: file.fileData,
            filename: file.fileName,
          },
          {
            caption: caption,
          },
        );
      }
    }
  } catch (error) {
    console.error("Error sending files to Telegram:", error);
    throw error;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
```

**Проверка:**

- [ ] Файл создан
- [ ] Функция отправки работает
- [ ] Форматирование размера файла работает

#### Часть 2: Обновить submit-exchange-request

**Файл:** `app/api/submit-exchange-request/route.ts`

```typescript
// Добавить импорты
import { getRequestFilesByRequestId } from "@/lib/database/file-queries";
import { sendFilesToTelegram } from "@/lib/telegram/send-files";

// ... existing code

// После создания заявки и сохранения в БД:
const files = await getRequestFilesByRequestId(requestId);

// Отправить основное сообщение
const filesInfoText = files.length > 0 ? `\n📎 *Прикрепленные файлы:* ${files.length} шт.\n` : "";

const message = `
🔔 *Новая заявка на обмен токенов*

📋 *ID заявки:* ${requestId}
💰 *Сумма токенов:* ${data.tokenAmount} TOKEN
💵 *Сумма фиата:* ${data.fiatAmount} EUR
📊 *Курс:* ${data.rate}
💸 *Комиссия:* ${data.commission}%

💼 *Адрес кошелька:*
\`${data.walletAddress}\`

📧 *Email клиента:* ${data.email}
${data.comment ? `📝 *Комментарий:* ${data.comment}` : ""}
${filesInfoText}
⏰ *Время:* ${new Date().toLocaleString("ru-RU")}
`;

// Send main message with keyboard
const managerChatId = process.env.TELEGRAM_MANAGER_CHAT_ID;
if (managerChatId) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("✅ Обработать", `approve_${requestId}`)],
    [Markup.button.callback("❌ Отклонить", `reject_${requestId}`)],
  ]);

  await bot.telegram.sendMessage(managerChatId, message, {
    parse_mode: "Markdown",
    reply_markup: keyboard.reply_markup,
    disable_web_page_preview: true,
  });

  // Send files separately if they exist
  if (files.length > 0) {
    await sendFilesToTelegram(
      managerChatId,
      files.map((f) => ({
        id: f.id,
        fileName: f.file_name,
        fileType: f.file_type,
        fileSize: f.file_size,
        fileData: f.file_data instanceof Buffer ? f.file_data : Buffer.from(f.file_data, "base64"),
      })),
    );
  }
}
```

**Аналогично для Internal Request:**

**Файл:** `app/api/submit-request/route.ts`

```typescript
// Добавить аналогичную логику для internal requests
import { getRequestFilesByRequestId } from "@/lib/database/file-queries";
import { sendFilesToTelegram } from "@/lib/telegram/send-files";

// После создания заявки:
const files = await getRequestFilesByRequestId(requestId);

// Отправить основное сообщение, затем файлы
if (files.length > 0) {
  await sendFilesToTelegram(
    managerChatId,
    files.map((f) => ({
      id: f.id,
      fileName: f.file_name,
      fileType: f.file_type,
      fileSize: f.file_size,
      fileData: f.file_data instanceof Buffer ? f.file_data : Buffer.from(f.file_data, "base64"),
    })),
  );
}
```

**Проверка:**

- [ ] Файлы отправляются в Telegram
- [ ] Каждый файл отправляется отдельно
- [ ] Подписи к файлам корректны
- [ ] Обработка ошибок работает

**⚠️ Важно:**

- Telegram Bot API имеет лимит на размер файла: **50 MB** для обычных ботов
- Для продакшена рекомендуется добавить проверку размера перед отправкой
- Если файл больше 50MB, отправить только ссылку для скачивания

### Шаг 4.2: Обновить next.config.ts

**Файл:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  // ... existing config

  // Add experimental config for larger uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
```

**Проверка:**

- [ ] Конфигурация обновлена
- [ ] Размер body увеличен до 25MB

### Шаг 4.3: Функциональное тестирование

**Чеклист тестирования:**

**Тест 1: Загрузка одного PDF файла**

- [ ] Выбрать файл .pdf до 10MB
- [ ] Отправить форму Exchange
- [ ] Проверить сохранение в БД
- [ ] Проверить скачивание через /api/files/download?id=xxx

**Тест 2: Загрузка нескольких файлов**

- [ ] Выбрать 3-5 разных файлов
- [ ] Отправить форму Internal Request
- [ ] Проверить все файлы сохранились

**Тест 3: Превышение лимитов**

- [ ] Попробовать загрузить файл > 10MB (должна быть ошибка)
- [ ] Попробовать загрузить 6 файлов (должна быть ошибка)
- [ ] Проверить сообщения об ошибках

**Тест 4: Неправильный тип файла**

- [ ] Попробовать загрузить .zip файл
- [ ] Проверить сообщение об ошибке

**Тест 5: Скачивание файла**

- [ ] Создать заявку с файлами
- [ ] Получить ID файла из БД
- [ ] Открыть /api/files/download?id=xxx
- [ ] Проверить, что файл открывается

**Тест 6: Удаление заявки**

- [ ] Создать заявку с файлами
- [ ] Удалить заявку
- [ ] Проверить, что файлы тоже удалились (CASCADE)

**Тест 7: Telegram уведомления с файлами**

- [ ] Создать заявку Exchange с 1 PDF файлом
- [ ] Проверить основное сообщение в Telegram боте
- [ ] Проверить отображение "Прикрепленные файлы: 1 шт."
- [ ] Проверить, что PDF файл пришел отдельным сообщением
- [ ] Проверить, что файл можно скачать из Telegram
- [ ] Проверить корректное имя файла при скачивании
- [ ] Создать заявку Internal Request с 3 разными файлами (.pdf, .xlsx, .docx)
- [ ] Проверить, что все 3 файла пришли в Telegram
- [ ] Проверить подписи к файлам (имя + размер)
- [ ] Проверить, что все файлы можно скачать

**Проверка:**

- [ ] Все тесты пройдены
- [ ] Ошибки обработаны корректно
- [ ] UX интуитивный

### Шаг 4.4: Документация

**Обновить:** `docs/architecture.md`

Добавить секцию о файлах:

````markdown
## 📎 File Attachments

Проект поддерживает прикрепление файлов к заявкам:

- **Хранение:** PostgreSQL BYTEA
- **Форматы:** PDF, Excel, Word, TXT, CSV
- **Макс. размер:** 10MB на файл
- **Макс. количество:** 5 файлов на заявку

### API Endpoints

- `POST /api/files/upload` - Загрузка файлов
- `GET /api/files/download?id=xxx` - Скачивание файла

### Database Schema

```sql
request_files (
  id UUID,
  request_id VARCHAR(50),
  request_type VARCHAR(20),
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  file_data BYTEA,
  uploaded_at TIMESTAMP
)
```
````

```

**Проверка:**
- [ ] Документация обновлена
- [ ] Примеры добавлены

---

## ✅ Чеклист выполнения

### Фаза 1: База данных ✅

- [ ] Миграция SQL создана
- [ ] Drizzle схема создана
- [ ] Query функции созданы
- [ ] Миграция применена

### Фаза 2: Backend API ✅

- [ ] Утилита валидации создана
- [ ] Upload endpoint работает
- [ ] Download endpoint работает
- [ ] Существующие endpoints обновлены

### Фаза 3: Frontend компоненты ✅

- [ ] FileUploader компонент создан
- [ ] Утилита конвертации создана
- [ ] ExchangeSection обновлена
- [ ] InternalRequestForm обновлена

### Фаза 4: Интеграция и тестирование ✅

- [ ] Утилита sendFilesToTelegram создана
- [ ] Telegram уведомления обновлены
- [ ] Файлы отправляются в Telegram
- [ ] next.config.ts обновлен
- [ ] Все тесты пройдены
- [ ] Telegram тесты с файлами пройдены
- [ ] Документация обновлена

---

## 📊 Оценка времени

| Фаза | Задачи | Время | Приоритет |
|------|--------|-------|-----------|
| **Фаза 1** | База данных | 1-2 часа | 🔴 Critical |
| **Фаза 2** | Backend API | 3-4 часа | 🔴 Critical |
| **Фаза 3** | Frontend | 4-5 часов | 🔴 Critical |
| **Фаза 4** | Тестирование + Telegram | 4-5 часов | 🟡 Important |
| **Итого** | | **12-16 часов** | |

**Общее время:** 1.5-2 рабочих дня

---

## 🎯 Следующие шаги

После завершения всех фаз:

1. **Code Review** - проверка кода коллегами
2. **Deploy to Dev** - деплой на dev окружение
3. **Production Testing** - тесты на production-like среде
4. **Deploy to Production** - финальный деплой
5. **Monitoring** - мониторинг использования файлов

---

**Версия:** 2.1
**Дата:** 31.10.2025
**Статус:** Draft, готов к реализации

**Изменения:**
- Добавлена интеграция с Telegram для отправки файлов
- Утилита `sendFilesToTelegram` для отправки файлов в бот
- Расширенные тесты для проверки скачивания файлов из Telegram

> ⚠️ **Важно:** Выполнять фазы последовательно, проверяя каждый шаг перед переходом к следующему.
```
