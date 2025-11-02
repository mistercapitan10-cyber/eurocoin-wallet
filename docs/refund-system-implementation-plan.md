# План реализации системы возврата средств

**Дата создания:** 2025-01-27  
**Основание:** [Анализ готовности системы возврата средств](./refund-system-readiness-analysis.md)

---

## 📋 Обзор плана

Этот документ описывает поэтапную реализацию всех недостающих компонентов системы возврата средств. План только включают функции, которые еще не реализованы или реализованы частично.

**Общее время разработки:** ~25-35 часов

---

## 🎯 Порядок реализации (рекомендуемый)

1. **Этап 1:** Доработка формы заявления на возврат (4-6 часов)
2. **Этап 2:** Система внутреннего баланса (8-12 часов)
3. **Этап 3:** Функционал вывода средств (12-16 часов)
4. **Этап 4:** Оплата за услуги (2 часа - вариант A)

---

# Этап 1: Доработка формы заявления на возврат

**Приоритет:** Высокий  
**Время:** 4-6 часов  
**Зависимости:** Нет

---

## Стадия 1.1: Подготовка базы данных

**Время:** 1-1.5 часа

### Задачи:

- [ ] Создать миграцию для добавления полей в таблицу `internal_requests`
- [ ] Добавить поле для полного ФИО или разделить на Фамилия/Имя/Отчество
- [ ] Добавить поле для суммы потерянных средств
- [ ] Создать таблицу для хранения загруженных файлов (чеков)

### Файлы:

**Создать:** `lib/database/migrations/add-refund-request-fields.sql`

```sql
-- Add fields to internal_requests table for refund functionality
ALTER TABLE internal_requests
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS lost_amount DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS lost_amount_currency VARCHAR(10) DEFAULT 'USD';

-- Create table for storing uploaded files (receipts, documents)
CREATE TABLE IF NOT EXISTS request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES internal_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_request_files_request_id ON request_files(request_id);

-- Add comment
COMMENT ON COLUMN internal_requests.full_name IS 'Full name for refund requests (can be used instead of separate name fields)';
COMMENT ON COLUMN internal_requests.lost_amount IS 'Amount of lost funds that user wants to recover';
```

### Проверка:

- [ ] Миграция успешно применяется
- [ ] Таблица `request_files` создана
- [ ] Поля добавлены в `internal_requests`

---

## Стадия 1.2: API для загрузки файлов

**Время:** 1.5-2 часа

### Задачи:

- [ ] Создать API endpoint для загрузки файлов
- [ ] Реализовать валидацию файлов (тип, размер)
- [ ] Сохранять файлы локально или в облачное хранилище
- [ ] Сохранять метаданные файлов в БД

### Файлы:

**Создать:** `app/api/upload/receipt/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { query } from "@/lib/database/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string;

    if (!file || !requestId) {
      return NextResponse.json(
        { error: "File and requestId are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, PDF" },
        { status: 400 }
      );
    }

    // Validate file size
    Berlinif (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "receipts");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const relativePath = `/uploads/receipts/${fileName}`;
    const result = await query(
      `INSERT INTO request_files (request_id, file_name, file_path, file_size, file_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, file_name, file_path`,
      [requestId, file.name, relativePath, file.size, file.type]
    );

    return NextResponse.json({
      success: true,
      file: {
        id: result.rows[0].id,
        name: result.rows[0].file_name,
        path: result.rows[0].file_path,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
```

**Создать:** `lib/database/queries.ts` (добавить функции)

```typescript
// Add to existing queries.ts file

export interface RequestFile {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_at: Date;
}

export async function getRequestFiles(requestId: string): Promise<RequestFile[]> {
  const result = await query(
    "SELECT * FROM request_files WHERE request_id = $1 ORDER BY uploaded_at DESC",
    [requestId],
  );
  return result.rows;
}

export async function deleteRequestFile(fileId: string): Promise<void> {
  await query("DELETE FROM request_files WHERE id = $1", [fileId]);
}
```

### Проверка:

- [ ] API принимает файлы
- [ ] Файлы сохраняются на сервере
- [ ] Метаданные сохраняются в БД
- [ ] Валидация работает корректно

---

## Стадия 1.3: Обновление формы заявления

**Время:** 1.5-2 часа

### Задачи:

- [ ] Добавить поля: Фамилия, Имя, Отчество (или полное ФИО)
- [ ] Добавить поле "Сумма потерянных средств"
- [ ] Добавить компонент загрузки файлов (чеки)
- [ ] Обновить валидацию формы
- [ ] Обновить отправку данных на API

### Файлы:

**Изменить:** `components/forms/internal-request-form.tsx`

Добавить в интерфейс `FormState`:

```typescript
interface FormState {
  requester: string;
  lastName?: string; // NEW
  firstName?: string; // NEW
  middleName?: string; // NEW
  fullName?: string; // NEW (alternative to separate fields)
  lostAmount?: string; // NEW
  department: string;
  requestType: string;
  description: string;
  priority: "low" | "normal" | "high";
  walletAddress: string;
  uploadedFiles?: File[]; // NEW
}
```

Добавить в форму:

```typescript
// Add file upload component
<div className="space-y-2">
  <label className="text-sm font-medium">
    {t("internalForm.receipts.label")}
  </label>
  <input
    type="file"
    multiple
    accept="image/*,.pdf"
    onChange={(e) => {
      const files = Array.from(e.target.files || []);
      setForm((prev) => ({ ...prev, uploadedFiles: files }));
    }}
    className="..."
  />
  <p className="text-xs text-muted">
    {t("internalForm.receipts.hint")}
  </p>
</div>

// Add lost amount field
<div className="space-y-2">
  <label className="text-sm font-medium">
    {t("internalForm.lostAmount.label")}
  </label>
  <input
    type="number"
    step="0.01"
    min="0"
    value={form.lostAmount || ""}
    onChange={(e) => handleChange("lostAmount", e.target.value)}
    placeholder={t("internalForm.lostAmount.placeholder")}
    className="..."
  />
</div>

// Add name fields (choose one approach)
// Option 1: Full name (single field)
<div className="space-y-2">
  <label className="text-sm font-medium">
    {t("internalForm.fullName.label")}
  </label>
  <input
    type="text"
    value={form.fullName || ""}
    onChange={(e) => handleChange("fullName", e.target.value)}
    required
    className="..."
  />
</div>

// Option 2: Separate fields (last, first, middle)
<div className="grid grid-cols纷呈-3 gap-4">
  <div>
    <label>{t("internalForm.lastName.label")}</label>
    <input type="text" value={form.lastName || ""} ... />
  </div>
  <div>
    <label>{t("internalForm.firstName.label")}</label>
    <input type="text" value={form.firstName || ""} ... />
  </div>
  <div>
    <label>{t("internalForm.middleName.label")}</label>
    <input type="text" value={form.middleName || ""} ... />
  </div>
</div>
```

Обновить `handleSubmit`:

```typescript
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  // Validate new fields
  if (!form.fullName && (!form.firstName || !form.lastName)) {
    toast.error(t("internalForm.validation.fullNameRequired"));
    return;
  }

  if (!form.lostAmount || parseFloat(form.lostAmount) <= 0) {
    toast.error(t("internalForm.validation.lostAmountRequired"));
    return;
  }

  setIsSubmitting(true);

  try {
    // First, submit request
    const response = await fetch("/api/submit-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        walletAddress: form.walletAddress || address,
        userId: userId || undefined,
        email: email || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit request");
    }

    // Then, upload files if any
    if (form.uploadedFiles && form.uploadedFiles.length > 0) {
      for (const file of form.uploadedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("requestId", data.requestId);

        await fetch("/api/upload/receipt", {
          method: "POST",
          body: formData,
        });
      }
    }

    triggerConfetti();
    toast.success(t("internalForm.success"));

    // Reset form
    setForm(initialState);

    // Dispatch event for investigation progress update
    window.dispatchEvent(new CustomEvent("requestSubmitted"));
  } catch (error) {
    console.error("Error submitting request:", error);
    toast.error(t("internalForm.error"));
  } finally {
    setIsSubmitting(false);
  }
};
```

### Проверка:

- [ ] Все новые поля отображаются в форме
- [ ] Валидация работает
- [ ] Файлы загружаются после отправки заявки
- [ ] Данные корректно отправляются на API

---

## Стадия 1. )4: Обновление API приема заявок

**Время:** 0.5-1 час

### Задачи:

- [ ] Обновить интерфейс `RequestFormData` в API
- [ ] Добавить обработку новых полей
- [ ] Обновить функцию `createInternalRequest`

### Файлы:

**Изменить:** `app/api/submit-request/route.ts`

```typescript
interface RequestFormData {
  requester: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  fullName?: string;
  lostAmount?: string;
  department: string;
  requestType: string;
  priority: string;
  description: string;
  walletAddress?: string;
  userId?: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: RequestFormData = await request.json();

    // Validate required fields (including new ones)
    if (!data.requester || !data.department || !data.requestType || !data.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!data.fullName && (!data.firstName || !data.lastName)) {
      return NextResponse.json({ error: "Full name or first/last name required" }, { status: 400 });
    }

    if (!data.lostAmount || parseFloat(data.lostAmount) <= 0) {
      return NextResponse.json({ error: "Lost amount must be greater than 0" }, { status: 400 });
    }

    // Generate request ID
    const requestId = `IR-${Date.now()}`;

    // Save to database with new fields
    try {
      await createInternalRequest({
        id: requestId,
        requester: data.requester,
        full_name:
          data.fullName || `${data.lastName} ${data.firstName} ${data.middleName || ""}`.trim(),
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName,
        lost_amount: data.lostAmount ? parseFloat(data.lostAmount) : null,
        lost_amount_currency: "USD",
        department: data.department,
        request_type: data.requestType,
        priority: data.priority,
        description: data.description,
        email: data.email || undefined,
        wallet_address: data.walletAddress || undefined,
        user_id: data.userId,
      });
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
      return NextResponse.json({ error: "Failed to save request to database" }, { status: 500 });
    }

    // ... rest of email sending logic ...

    return NextResponse.json({
      success: true,
      requestId,
    });
  } catch (error) {
    console.error("里程Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Изменить:** `lib/database/queries.ts`

```typescript
export interface CreateInternalRequestData {
  id: string;
  wallet_address?: string;
  requester: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  lost_amount?: number;
  lost_amount_currency?: string;
  email?: string;
  department: string;
  request_type: string;
  priority: string;
  description: string;
  user_id?: string;
}

export async function createInternalRequest(
  data: CreateInternalRequestData,
): Promise<InternalRequest> {
  const result = await query(
    `INSERT INTO internal_requests
     (id, wallet_address, requester, full_name, first_name, last_name, middle_name,
      lost_amount, lost_amount_currency, email, department, request_type, priority,
      description, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      data.id,
      data.wallet_address || null,
      data.requester,
      data.full_name || null,
      data.first_name || null,
      data.last_name || null,
      data.middle_name || null,
      data.lost_amount || null,
      data.lost_amount_currency || "USD",
      data.email || null,
      data.department,
      data.request_type,
      data.priority,
      data.description,
      "pending",
      data.user_id || null,
    ],
  );

  return result.rows[0];
}
```

### Проверка:

- [ ] API принимает новые поля
- [ ] Данные сохраняются в БД
- [ ] Email уведомления содержат новую информацию

---

## Итоги Этапа 1

**Что реализовано:**

- ✅ Поля для ФИО (полное или раздельное)
- ✅ Поле для суммы потерянных средств
- ✅ Загрузка файлов (чеки, документы)
- ✅ Хранение файлов и метаданных
- ✅ Обновленный API и формы

**Следующий этап:** Система внутреннего баланса

---

# Этап 2: Система внутреннего баланса

**Приоритет:** Высокий  
**Время:** 8-12 часов  
**Зависимости:** Этап 1 (для использования lost_amount из заявок)

---

## Стадия 2.1: Создание таблицы балансов

**Время:** 1 час

### Задачи:

- [ ] Создать таблицу `user_balances`
- [ ] Создать таблицу для истории операций с балансом
- [ ] Добавить индексы и триггеры

### Файлы:

**Создать:** `lib/database/migrations/create-user-balances.sql`

```sql
-- User Balances Table
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  wallet_address VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  balance DECIMAL(20, 8) DEFAULT 0 NOT NULL,
  currency VARCHAR(10) DEFAULT 'TOKEN' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one balance per user/wallet/email combination
  UNIQUE(user_id, wallet_address, email, currency)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_wallet ON user_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_balances_email ON user_balances(email);

-- Balance Transactions History Table
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id UUID NOT NULL REFERENCES user_balances(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TOKEN' NOT NULL,
  description TEXT,
  related_request_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (related_request_id) REFERENCES internal_requests(id) ON DELETE SET NULL
);

-- Indexes for balance transactions
CREATE INDEX IF NOT EXISTS idx_balance_transactions_balance_id ON balance_transactions(balance_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created ON balance_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_request ON balance_transactions(related_request_id);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_user_balances_updated_at ON user_balances;
CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON user_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Проверка:

- [ ] Таблицы созданы успешно
- [ ] Индексы созданы
- [ ] Триггеры работают

---

## Стадия 2.2: Функции для работы с балансом

**Время:** 2-3 часа

### Задачи:

- [ ] Создать функции для получения баланса
- [ ] Создать функции для начисления баланса
- [ ] Создать функции для списания баланса
- [ ] Создать функции для получения истории операций

### Файлы:

**Изменить:** `lib/database/queries.ts` (добавить функции)

```typescript
// User Balance Interfaces
export interface UserBalance {
  id: string;
  user_id: string | null;
  wallet_address: string | null;
  email: string;
  balance: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface BalanceTransaction {
  id: string;
  balance_id: string;
  transaction_type: "credit" | "debit";
  amount: string;
  currency: string;
  description: string | null;
  related_request_id: string | null;
  created_at: Date;
}

// Get or create user balance
export async function getOrCreateUserBalance(params: {
  userId?: string;
  walletAddress?: string;
  email: string;
  currency?: string;
}): Promise<UserBalance> {
  const currency = params.currency || "TOKEN";

  // Try to find existing balance
  let queryStr = `
    SELECT * FROM user_balances
    WHERE email = $1 AND currency = $2
  `;
  const queryParams: any[] = [params.email, currency];

  if (params.userId) {
    queryStr += " AND user_id = $3";
    queryParams.push(params.userId);
  } else {
    queryStr += " AND user_id IS NULL";
  }

  if (params.walletAddress) {
    queryStr += ` AND wallet_address = $${queryParams.length + 1}`;
    queryParams.push(params.walletAddress);
  } else {
    queryStr += " AND wallet_address IS NULL";
  }

  const result = await query(queryStr, queryParams);

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Create new balance
  const insertResult = await query(
    `INSERT INTO user_balances (user_id, wallet_address, email, balance, currency)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [params.userId || null, params.walletAddress || null, params.email, 0, currency],
  );

  return insertResult.rows[0];
}

// Get user balance
export async function getUserBalance(params: {
  userId?: string;
  walletAddress?: string;
  email: string;
}): Promise<UserBalance | null> {
  const balance = await getOrCreateUserBalance(params);
  return balance;
}

// Credit balance (add funds)
export async function creditBalance(params: {
  balanceId: string;
  amount: number;
  currency?: string;
  description?: string;
  relatedRequestId?: string;
}): Promise<UserBalance> {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Update balance
    const updateResult = await client.query(
      `UPDATE user_balances
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [params.amount, params.balanceId],
    );

    if (updateResult.rows.length === 0) {
      throw new Error("Balance not found");
    }

    // Create transaction record
    await client.query(
      `INSERT INTO balance_transactions
       (balance_id, transaction_type, amount, currency, description, related_request_id)
       VALUES ($1, 'credit', $2, $3, $4, $5)`,
      [
        params.balanceId,
        params.amount,
        params.currency || "TOKEN",
        params.description || null,
        params.relatedRequestId || null,
      ],
    );

    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Debit balance (subtract funds)
export async function debitBalance(params: {
  balanceId: string;
  amount: number;
  currency?: string;
  description?: string;
  relatedRequestId?: string;
}): Promise<UserBalance> {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Check balance
    const balanceResult = await client.query("SELECT balance FROM user_balances WHERE id = $1", [
      params.balanceId,
    ]);

    if (balanceResult.rows.length === 0) {
      throw new Error("Balance not found");
    }

    const currentBalance = parseFloat(balanceResult.rows[0].balance);
    if (currentBalance < params.amount) {
      throw new Error("Insufficient balance");
    }

    // Update balance
    const updateResult = await client.query(
      `UPDATE user_balances
       SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [params.amount, params.balanceId],
    );

    // Create transaction record
    await client.query(
      `INSERT INTO balance_transactions
       (balance_id, transaction_type, amount, currency, description, related_request_id)
       VALUES ($1, 'debit', $2, $3, $4, $5)`,
      [
        params.balanceId,
        params.amount,
        params.currency || "TOKEN",
        params.description || null,
        params.relatedRequestId || null,
      ],
    );

    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Get balance transactions history
export async function getBalanceTransactions(
  balanceId: string,
  limit: number = 50,
): Promise<BalanceTransaction[]> {
  const result = await query(
    `SELECT * FROM balance_transactions
     WHERE balance_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [balanceId, limit],
  );

  return result.rows;
}
```

### Проверка:

- [ ] Функции работают корректно
- [ ] Транзакции обрабатываются атомарно
- [ ] История операций сохраняется

---

## Стадия 2.3: API endpoints для баланса

**Время:** 2-3 часа

### Задачи:

- [ ] Создать GET endpoint для получения баланса
- [ ] Создать POST endpoint для начисления баланса (админ)
- [ ] Добавить авторизацию для админских операций

### Файлы:

**Создать:** `app/api/balance/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserBalance,
  creditBalance,
  getOrCreateUserBalance,
} from "@/lib/database/queries";

// GET /api/balance - Get user balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    const walletAddress = searchParams.get("walletAddress");
    const email = searchParams.get("email");

    // Determine user identifier
    let userId: string | undefined;
    let userEmail: string;
    let userWallet: string | undefined;

    if (session?.user) {
      // OAuth user
      userId = session.user.id;
      userEmail = session.user.email || email || "";
    } else if (walletAddress) {
      // MetaMask user
      userWallet = walletAddress;
      userEmail = email || "";
    } else {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const balance = await getUserBalance({
      userId,
      walletAddress: userWallet,
      email: userEmail,
    });

    if (!balance) {
      return NextResponse.json(
        { error: "Balance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      balance: parseFloat(balance.balance),
      currency: balance.currency happy,
      formattedBalance: parseFloat(balance.balance).toFixed(8),
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}

// POST /api/balance - Add balance (admin only or automated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, email, amount, description, requestId } = body;

    // Validate required fields
    if (!email || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Email and amount (greater than 0) are required" },
        { status: 400 }
      );
    }

    // Get or create balance
    const balance = await getOrCreateUserBalance({
      userId,
      walletAddress,
      email,
    });

    // Credit balance
    const updatedBalance = await creditBalance({
      balanceId: balance.id,
      amount: parseFloat(さamount.toString()),
      description: description || "Balance credited",
      relatedRequestId: requestId,
    });

    return NextResponse.json({
      success: true,
      balance: parseFloat(updatedBalance.balance),
      currency: updatedBalance.currency,
    });
  } catch (error) {
    console.error("Error crediting balance:", error);
    return NextResponse.json(
      { error: "Failed to credit balance" },
      { status: 500 }
    );
  }
}
```

### Проверка:

- [ ] GET endpoint возвращает баланс пользователя
- [ ] POST endpoint начисляет баланс
- [ ] Ошибки обрабатываются корректно

---

## Стадия 2.4: Компонент отображения баланса

**Время:** 2-3 часа

### Задачи:

- [ ] Создать hook для получения внутреннего баланса
- [ ] Создать компонент для отображения внутреннего баланса
- [ ] Интегрировать компонент на главную страницу

### Файлы:

**Создать:** `hooks/use-internal-balance.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useAuth } from "./use-auth";

export function useInternalBalance() {
  const { address } = useAccount();
  const { userId, email, authType } = useAuth();

  return useQuery({
    queryKey: ["internalBalance", userId, address, email],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (authType === "oauth" && email) {
        // OAuth user
        params.append("email", email);
      } else if (address) {
        // MetaMask user
        params.append("walletAddress", address);
        if (email) {
          params.append("email", email);
        }
      } else {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/balance?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      return await response.json();
    },
    enabled: !!(userId || address) && !!email,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
```

**Создать:** `components/wallet/internal-balance-card.tsx`

```typescript
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInternalBalance } from "@/hooks/use-internal-balance";
import { useTranslation } from "@/hooks/use-translation";

export function InternalBalanceCard() {
  const { data, isLoading, error } = useInternalBalance();
  const t = useTranslation();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("wallet.internalBalance.title")}</CardTitle>
          <CardDescription>{t("wallet.internalBalance.error")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("wallet.internalBalance.title")}</CardTitle>
        <CardDescription>{t("wallet.internalBalance.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {data?.formattedBalance || "0.00000000"} {data?.currency || "TOKEN"}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("wallet.internalBalance.hint")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Изменить:** `app/page.tsx` (добавить компонент)

```typescript
import { InternalBalanceCard } from "@/components/wallet/internal-balance-card-retention";

// В секции token-balance добавить:
<section id="token-balance" className="flex flex-col gap-6">
  <BalanceCard />
  <InternalBalanceCard /> {/* NEW */}
  <div className="grid gap-6 md:grid-cols-2">
    <PriceTicker />
    <TaxCard />
  </div>
  <DexscreenerChart />
</section>
```

**Изменить:** `components/wallet/index.ts` (экспорт)

```typescript
export { InternalBalanceCard } from "./internal-balance-card";
```

### Проверка:

- [ ] Hook получает баланс
- [ ] Компонент отображает баланс
- [ ] Баланс обновляется автоматически

---

## Стадия 2.5: Автоматическое начисление при одобрении заявки

**Время:** 1-2 часа

### Задачи:

- [ ] Добавить логику автоматического начисления при статусе "completed"
- [ ] Использовать `lost_amount` из заявки
- [ ] Добавить проверку, что начисление происходит только один раз

### Файлы:

**Изменить:** `app/api/webhook/update-request/route.ts`

```typescript
import { creditBalance, getOrCreateUserBalance } from "@/lib/database/queries";

// В функции обработки обновления статуса добавить:

// Check if status changed to "completed"
if (newStatus === "completed" && oldStatus !== "completed") {
  // Get request details
  const request = await getInternalRequestById(requestId);

  if (request && request.lost_amount && request.lost_amount > 0) {
    try {
      // Determine user identifiers
      const userId = request.user_id || undefined;
      const walletAddress = request.wallet_address || undefined;
      const email = request.email;

      if (!email) {
        console.error("Cannot credit balance: no email in request");
      } else {
        // Get or create balance
        const balance = await getOrCreateUserBalance({
          userId,
          walletAddress,
          email,
        });

        // Credit balance
        await creditBalance({
          balanceId: balance.id,
          amount: parseFloat(request.lost_amount.toString()),
          description: `Balance credited from approved refund request ${requestId}`,
          relatedRequestId: requestId,
        });

        console.log(`Balance credited for request ${requestId}`);
      }
    } catch (error) {
      console.error(`Error crediting balance for request ${requestId}:`, error);
      // Don't fail the status update if balance credit fails
      // Log error for manual review
    }
  }
}
```

### Проверка:

- [ ] При одобрении заявки баланс начисляется автоматически
- [ ] Начисление происходит только один раз
- [ ] Сумма соответствует `lost_amount` из заявки

---

## Итоги Этапа 2

**Что реализовано:**

- ✅ Таблица балансов и история операций
- ✅ Функции для работы с балансом
- ✅ API endpoints для получения и начисления баланса
- ✅ Компонент отображения внутреннего баланса
- ✅ Автоматическое начисление при одобрении заявки

**Следующий этап:** Функционал вывода средств

---

# Этап 3: Функционал вывода средств

**Приоритет:** Высокий  
**Время:** 12-16 часов  
**Зависимости:** Этап 2 (система внутреннего баланса)

---

## Стадия 3.1: Таблица истории выводов

**Время:** 1 час

### Задачи:

- [ ] Создать таблицу `withdrawals` для истории выводов
- [ ] Добавить индексы и связи

### Файлы:

**Создать:** `lib/database/migrations/create-withdrawals-table.sql`

```sql
-- Withdrawals Table
CREATE TABLE IF NOT EXISTS有以下withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  wallet_address VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TOKEN' NOT NULL,
  to_wallet_address VARCHAR(255) NOT NULL,
  tx_hash VARCHAR(66), -- Blockchain transaction hash
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  balance_transaction_id UUID REFERENCES balance_transactions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet ON withdrawals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_withdrawals_email ON withdrawals(email);
CREATE INDEX IF NOT EXISTS idx GCCwithdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_tx_hash ON withdrawals(tx_hash);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created ON withdrawals(created_at DESC);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Проверка:

- [ ] Таблица создана
- [ ] Индексы созданы
- [ ] Триггер работает

---

## Стадия 3.2: Функции для работы с выводами

**Время:** 2 часа

### Задачи:

- [ ] Создать функции для создания вывода
- [ ] Создать функции для получения истории выводов
- [ ] Создать функции для обновления статуса вывода

### Файлы:

**Изменить:** `lib/database/queries.ts` (добавить функции)

```typescript
// Withdrawal Interfaces
export interface Withdrawal {
  id: string;
  user_id: string | null;
  wallet_address: string | null;
  email: string;
  amount: string;
  currency: string;
  to_wallet_address: string;
  tx_hash: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  balance_transaction_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWithdrawalData {
  userId?: string;
  walletAddress?: string;
  email: string;
  amount: number;
  currency?: string;
  toWalletAddress: string;
}

// Create withdrawal
export async function createWithdrawal(data: CreateWithdrawalData): Promise<Withdrawal> {
  const result = await query(
    `INSERT INTO withdrawals
     (user_id, wallet_address, email, amount, currency, to_wallet_address, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.userId || null,
      data.walletAddress || null,
      data.email,
      data.amount,
      data.currency || "TOKEN",
      data.toWalletAddress,
      "pending",
    ],
  );

  return result.rows[0];
}

// Get withdrawals by user
export async function getWithdrawalsByUser(params: {
  userId?: string;
  walletAddress?: string;
  email: string;
  limit?: number;
}): Promise<Withdrawal[]> {
  let queryStr = `
    SELECT * FROM withdrawals
    WHERE email = $1
  `;
  const queryParams: any[] = [params.email];

  if (params.userId) {
    queryStr += " AND user_id = $2";
    queryParams.push(params.userId);
  } else if (params.walletAddress - only) {
    queryStr += " AND wallet_address = $2";
    queryParams.push(params.walletAddress);
  }

  queryStr += " ORDER BY created_at DESC LIMIT $3";
  queryParams.push(params.limit || 50);

  const result = await query(queryStr, queryParams);
  return result.rows;
}

// Update withdrawal status
export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: "pending" | "processing" | "completed" | "failed",
  txHash?: string,
  errorMessage?: string,
): Promise<Withdrawal> {
  const result = await query(
    `UPDATE withdrawals
     SET status = $1, tx_hash = COALESCE($2, tx_hash),
         error_message = COALESCE($3, error_message),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, txHash || null, errorMessage || null, withdrawalId],
  );

  if (result.rows.length === 0) {
    throw new Error("Withdrawal not found");
  }

  return result.rows[0];
}

// Link withdrawal to balance transaction
export async function linkWithdrawalToBalanceTransaction(
  withdrawalId: string,
  balanceTransactionId: string,
): Promise<void> {
  await query("UPDATE withdrawals SET balance_transaction_id = $1 WHERE id = $2", [
    balanceTransactionId,
    withdrawalId,
  ]);
}
```

### Проверка:

- [ ] Функции работают корректно
- [ ] Выводы создаются в БД
- [ ] История получается корректно

---

## Стадия 3.3: API endpoint для вывода

**Время:** 3-4 часа

### Задачи:

- [ ] Создать POST endpoint для создания вывода
- [ ] Реализовать проверку баланса
- [ ] Реализовать списание баланса
- [ ] Реализовать отправку токенов (или поставить в очередь)

### Файлы:

**Создать:** `app/api/withdraw/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserBalance,
  debitBalance,
  createWithdrawal,
  updateWithdrawalStatus,
  linkWithdrawalToBalanceTransaction,
} from "@/lib/database/queries";
import { parseUnits, formatUnits } from "viem";
import { TOKEN_CONFIG } from "@/config/token";

// POST /api/withdraw - Create withdrawal request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { amount, toWalletAddress } = body机油;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!toWalletAddress || !/^0x[a-fA-F0-9]{40}$/.test(toWalletAddress)) {
      return NextResponse.json(
        { error: "Valid wallet address is required" },
        { status: 400 }
      );
    }

    // Get user identifiers
    let userId: string | undefined;
    let userEmail: string;
    let userWallet: string | undefined;

    if (session?.user) {
      userId = session.user.id;
      userEmail = session.user.email || "";
    } else {
      // For MetaMask users, email should be provided or extracted from balance
      userEmail = body.email certo|| "";
      userWallet = body.walletAddress || "";
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Get user balance
    const balance = await getUserBalance({
      userId,
      walletAddress: userWallet,
      email: userEmail,
    });

    if (!balance) {
      return NextResponse.json(
        { error: "Balance not found" },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(balance.balance);
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal record
    const withdrawal = await createWithdrawal({
      userId,
      walletAddress: userWallet,
      email: userEmail,
      amount,
      toWalletAddress,
    });

    // Update withdrawal status to processing
    await orgupdateWithdrawalStatus(withdrawal.id, "processing");

    try {
      // Debit balance
      const updatedBalance = await debitBalance({
        balanceId: balance.id,
        amount,
        description: `Withdrawal to ${toWalletAddress}`,
        relatedRequestId: withdrawal.id,
      });

      // Link withdrawal to balance transaction
      // Note: We need to get the last transaction ID
      // This is a simplified version - you might need to adjust

      // TODO: Send tokens to blockchain
      // For now, we'll mark as completed after balance is debited
      // In production, you should:
      // 1. Send tokens via wagmi/viem or server wallet
      // 2. Wait for transaction confirmation
      // 3. Update withdrawal with tx_hash
      // 4. Update status to completed

      // Placeholder: In real implementation, trigger blockchain transaction here
      // const txHash = await sendTokens(toWalletAddress, amount);

      // For now, mark as completed (manual processing or queue for admin)
      await updateWithdrawalStatus(withdrawal.id, "completed");

      return NextResponse.json({
        success: true,
        withdrawalId: withdrawal.id,
        message: "Withdrawal request created successfully",
        // In production, include tx_hash when available
      });
    } catch (error: any) {
      // Rollback withdrawal status
      await updateWithdrawalStatus(
        withdrawal.id,
        "failed",
        undefined,
        error.message
      );

      throw error;
    }
  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}

// GET /api/withdraw - Get withdrawal history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    const walletAddress = searchParams.get("walletAddress");
    const email = searchParams.get("email");

    let userId: string | undefined;
    let userEmail: string;
    let userWallet: string | undefined;

    if (session?.user) {
      userId = session.user.id;
      userEmail = session.user.email || email || "";
    } else if (walletAddress) {
      userWallet = walletAddress;
      userEmail = email || "";
    } else {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { getWithdrawalsByUser } = await import("@/lib/database/queries");
    const withdrawals = await getWithdrawalsByUser({
      userId,
      walletAddress: userWallet,
      email: userEmail,
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}
```

**Примечание:** Для отправки токенов на блокчейн нужно реализовать отдельную функцию. Это можно сделать:

1. **Вариант A:** Использовать wagmi на клиенте (требует подключенный кошелек)
2. **Вариант B:** Использовать серверный кошелек (требует приватный ключ на сервере)
3. **Вариант C:** Очередь для ручной обработки администратором

### Проверка:

- [ ] API создает вывод
- [ ] Баланс проверяется и списывается
- [ ] История выводов возвращается

---

## Стадия 3.4: Компонент формы вывода

**Время:** 3-4 часа

### Задачи:

- [ ] Создать страницу/компонент для вывода средств
- [ ] Добавить форму с полями: сумма, адрес кошелька
- [ ] Добавить валидацию
- [ ] Показать доступный баланс
- [ ] Обработать отправку запроса

### Файлы:

**Создать:** `components/wallet/withdraw-form.tsx`

```typescript
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useInternalBalance } from "@/hooks/use-internal-balance";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

export function WithdrawForm() {
  const { address } = useAccount();
  const { userId, email } = useAuth();
  const { data: balanceData, refetch } = useInternalBalance();
  const t = useTranslation();

  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBalance = balanceData?.balance || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t("withdraw.validation.amountRequired"));
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      toast.error(t("withdraw.validation.insufficientBalance"));
      return;
    }

    if (!toAddress || !/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      toast.error(t("withdraw.validation.invalidAddress"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          toWalletAddress: toAddress,
          walletAddress: address,
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal");
      }

      toast.success(t("withdraw.success"));
      setAmount("");
      setToAddress("");
      refetch(); // Refresh balance
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.error(error.message || t("withdraw.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground">
          {t("withdraw.availableBalance")}
        </div>
        <div className="text-2xl font-bold">
          {availableBalance.toFixed(8)} {balanceData?.currency || "TOKEN"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("withdraw.amount.label")}
          </label>
          <input
            type="number"
            step="0.00000001"
            min="0"
            max={availableBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("withdraw.amount.placeholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("withdraw.amount.hint")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("withdraw.toAddress.label")}
          </label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder={t("withdraw.toAddress.placeholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("withdraw.toAddress.hint")}
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || availableBalance <= 0}
          className="w-full"
        >
          {isSubmitting ? t("withdraw.processing") : t("withdraw.submit")}
        </Button>
      </form>
    </div>
  );
}
```

**Создать:** `app/withdraw/page.tsx`

```typescript
import { WithdrawForm } from "@/components/wallet/withdraw-form";
import { WithdrawHistory } from "@/components/profile/withdraw-history";
import { PageTitle } from "@/components/layout/page-title";
import { useTranslation } from "@/hooks/use-translation";

export default function WithdrawPage() {
  const t = useTranslation();

  return (
    <>
      <PageTitle title={t("withdraw.pageTitle")} description={t("withdraw.pageDescription")} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">
              {t("withdraw.formTitle")}
            </h2>
            <WithdrawForm />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">
              {t("withdraw.historyTitle")}
            </h2>
            <WithdrawHistory />
          </section>
        </div>
      </main>
    </>
  );
}
```

### Проверка:

- [ ] Форма отображается корректно
- [ ] Валидация работает
- [ ] Вывод создается успешно
- [ ] Баланс обновляется после вывода подача

---

## Стадия 3.5: Компонент истории выводов

**Время:** 2-3 часа

### Задачи:

釋 - [ ] Создать компонент для отображения истории выводов

- [ ] Получать данные из API
- [ ] Отображать статусы и суммы
- [ ] Интегрировать в профиль

### Файлы:

**Создать:** `components/profile/withdraw-history.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WithdrawHistory() {
  const { address } = useAccount();
  const { userId, email } = useAuth();
  const t = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["withdrawals", userId, address, email],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (userId && email) {
        params.append("email", email);
      } else if (address) {
        params.append("walletAddress", address);
        if (email) {
          params.append("email", email);
        }
      }

      const response = await fetch(`/api/withdraw?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch withdrawals");
      }

      return await response.json();
    },
    enabled: !!(userId || address) && !!email,
  });

  const withdrawals = data?.withdrawals || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("withdraw.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("withdraw.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t("withdraw.noWithdrawals")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "processing":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("withdraw.historyTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {withdrawals.map((withdrawal: any) => (
            <div
              key={withdrawal.id}
              className="flex items-center justify-between border-b pb-4"
            >
              <div className="space-y-1">
                <div className="font-medium">
                  {parseFloat(withdrawal.amount).toFixed(8)} {withdrawal.currency}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {withdrawal.to_wallet_address.slice(0, 10)}...
                  {withdrawal.to_wallet_address.slice(-8)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(withdrawal.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${getStatusColor(withdrawal.status)}`}>
                  {t(`withdraw.status.${withdrawal.status}`)}
                </div>
                {withdrawal.tx_hash && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {withdrawal.tx_hash.slice(0, 10)}...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Изменить:** `app/profile/page.tsx` (добавить компонент, если нужно)

### Проверка:

- [ ] История отображается корректно
- [ ] Статусы имеют правильные цвета
- [ ] Данные обновляются

---

## Стадия 3.6: Визуальное отображение токенов со стоимостью

**Время:** 1-2 часа

### Задачи:

- [ ] Добавить отображение эквивалента в USD для токенов вывода
- [ ] Использовать фиксированный или динамический курс
- [vote ] Обновить компоненты для показа стоимости

### Файлы:

**Создать:** `lib/pricing.ts` (добавить функцию для фиксированного курса)

```typescript
// Add to existing pricing.ts or create if doesn't exist

// For refund tokens, use a fixed display rate
// This doesn't reflect real market value, just for UI display
export const REFUND_TOKEN_DISPLAY_RATE = parseFloat(
  process.env.NEXT_PUBLIC_REFUND_TOKEN_DISPLAY_RATE || "1.0",
); // Default: 1 USD per token

export function getRefundTokenUsdValue(tokenAmount: number): number {
  return tokenAmount * REFUND_TOKEN_DISPLAY_RATE;
}

export function formatRefundTokenUsdValue(tokenAmount: number): string {
  const usdValue = getRefundTokenUsdValue(tokenAmount);
  return `≈ $${usdValue.toFixed(2)}`;
}
```

**Изменить:** `components/wallet/internal-balance-card.tsx` (добавить USD значение)

```typescript
import { formatRefundTokenUsdValue } from "@/lib/pricing";

// В компоненте добавить:
<div className="space-y-2">
  <div className="text-3xl font-bold">
    {data?.formattedBalance || "0.00000000"} {data?.currency || "TOKEN"}
  </div>
  <div className="text-lg text-muted-foreground">
    {formatRefundTokenUsdValue(parseFloat(data?.balance || "0"))}
  </div>
  <p className="text-sm text-muted-foreground">
    {t("wallet.internalBalance.hint")}
    <span className="block text-xs mt-1">
      {t("wallet.internalBalance.displayRate")}
    </span>
  </p>
</div>
```

**Изменить:** `components/wallet/withdraw-form.tsx` (показать USD при вводе суммы)

```typescript
import { formatRefundTokenUsdValue } from "@/lib/pricing";

// В форме добавить:
{amount && parseFloat(amount) > 0 && (
  <div className="text-sm text-muted-foreground">
    ≈ {formatRefundTokenUsdValue(parseFloat(amount))}
  </div>
)}
```

### Проверка:

- [ ] USD значения отображаются
- [ ] Курс настраивается через переменную окружения
- [ ] Отображение понятно пользователю

---

## Итоги Этапа 3

**Что реализовано:**

- ✅ Таблица истории выводов
- ✅ API для создания и получения выводов
- ✅ Компонент формы вывода
- ✅ Компонент истории выводов
- ✅ Списание баланса при выводе
- ✅ Визуальное отображение токенов со стоимостью

**Примечание:** Отправка токенов на блокчейн требует дополнительной реализации (серверный кошелек или клиентская интеграция с wagmi).

**Следующий этап:** Оплата за услуги

---

# Этап 4: Оплата за услуги

**Приоритет:** Средний  
**Время:** 2 часа (вариант A)  
**Зависимости:** Нет

---

## Стадия 4.1: Информационная страница об оплате

**Время:** 2 часа

### Задачи:

- [ ] Создать страницу или раздел "Оплата услуг"
- [ ] Добавить информацию о контактах поддержки
- [ ] Добавить информацию об обменнике
- [ ] Добавить ссылки на Telegram бота

### Файлы:

**Создать:** `app/payment/page.tsx`

```typescript
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";

export default function PaymentPage() {
  const t = useTranslation();

  return (
    <>
      <PageTitle
        title={t("payment.pageTitle")}
        description={t("payment.pageDescription")}
      />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("payment.support.title")}</CardTitle>
              <CardDescription>
                {t("payment.support.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  {t("payment.support.contactSupport")}
                </h3>
                <p className="text-muted-foreground">
                  {t("payment.support.instructions")}
                </p>
                <div className="mt-4 space-y-2">
                  <div>
                    <strong>Email:</strong>{" "}
                    <a
                      href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@company.io"}`}
                      className="text-primary hover:underline"
                    >
                      {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@company.io"}
                    </a>
                  </div>
                  <div>
                    <strong>Telegram:</strong>{" "}
                    <a
                      href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_LINK || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t("payment.support.telegramLink")}
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("payment.exchange.title")}</CardTitle>
              <CardDescription>
                {t("payment.exchange.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("payment.exchange.instructions")}
              </p>
              <Link
                href="/exchange"
                className="inline-block"
              >
                <Button>
                  {t("payment.exchange.goToExchange")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("payment.services.title")}</CardTitle>
            </CardHeader>
            <CardContent的服务>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>{t("payment.services.item1")}</li>
                <li>{t("payment.services.item2")}</li>
                <li>{t("payment.services.item3")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
```

**Изменить:** `components/layout/navigation.tsx` (добавить ссылку в меню)

```typescript
// Add to navigation menu:
<Link href="/payment">
  {t头发("nav.payment")}
</Link>
```

**Изменить:** `lib/i18n/translations.ts` (добавить переводы)

```typescript
// Add translations for payment page
payment: {
  pageTitle: "Оплата услуг",
  pageDescription: "Информация об оплате услуг и комиссий",
  support: {
    title: "Связь с поддержкой",
    description: "Для оплаты услуг и комиссий свяжитесь с нашим отделом поддержки",
    contactSupport: "Связаться с поддержкой",
    instructions: "Вы можете связаться с нами по email или через Telegram бота",
    telegramLink: "Перейти в Telegram бот",
  },
  exchange: {
    title: "Через обменник",
    description: "Оплата через наш обменник",
    instructions: "Вы можете оплатить услуги через наш обменник токенов",
    goToExchange: "Перейти к обменнику",
  },
  services: {
    title: "Что можно оплатить",
    item1: "Комиссии за вывод средств",
    item2: "Дополнительные услуги",
    item3: "Премиум функции",
  },
},
```

### Проверка:

- [ ] Страница отображается корректно
- [ ] Контакты актуальны
- [ ] Ссылки работают
- [ ] Переводы добавлены

---

## Итоги Этапа 4

**Что реализовано:**

- ✅ Информационная страница об оплате услуг
- ✅ Контакты поддержки и обменника
- ✅ Ссылки на Telegram бота и обменник

**Альтернативные варианты:**

- **Вариант B:** Расширение Telegram бота для оплаты (5-8 часов)
- **Вариант C:** Полная интеграция платежных систем на сайте (2-3 недели)

---

## 📊 Общий итог реализации

### Что будет реализовано:

1. ✅ **Заявление на возврат** — полная форма с ФИО, суммой, загрузкой чеков
2. ✅ **Система внутреннего баланса** — начисление, отображение, история
3. ✅ **Вывод средств** — форма, API, история, визуализация со стоимостью
4. ✅ **Оплата за услуги** — информационная страница (или расширенный вариант)

### Общее время разработки: ~25-35 часов

### Порядок выполнения:

1. **Неделя 1:** Этап 1 (форма) + Этап 2 (баланс) — 12-18 часов
2. **Неделя 2:** Этап 3 (вывод) — 12-16 часов
3. **Неделя 2-3:** Этап 4 (оплата) — 2 часа

### Важные замечания 연:

1. **Отправка токенов на блокчейн** требует дополнительной реализации (Стадия 3.3)
2. **Хранение файлов** может потребовать облачное хранилище (S3, Cloudinary) для продакшена
3. **Переменные окружения** нужно добавить в `.env`:
   - `NEXT_PUBLIC_REFUND_TOKEN_DISPLAY_RATE` — курс для отображения
   - `NEXT_PUBLIC_SUPPORT_EMAIL` — email поддержки
   - `NEXT_PUBLIC_TELEGRAM_BOT_LINK` — ссылка на бота
4. **Тестирование** каждой стадии перед переходом к следующей

---

## 🎯 Следующие шаги

1. Утвердить план реализации
2. Решить вопросы по открытым моментам (токены, хранение файлов, отправка на блокчейн)
3. Начать реализацию с Этапа 1
4. Тестировать после каждого этапа

---

**Дата последнего обновления:** 2025-01-27  
**Статус:** Готов к реализации




