# План реализации учета пользователей

## 📋 Обзор

Цель: Создать единую систему учета всех пользователей независимо от метода регистрации (кошелек MetaMask, email, Google OAuth), чтобы видеть полную статистику и аналитику пользователей.

**Текущая ситуация:**

- ✅ Пользователи через Email/Google OAuth автоматически сохраняются в БД через NextAuth
- ❌ Пользователи через MetaMask не сохраняются в БД, только cookie
- ❌ Нет единого места для просмотра всех пользователей
- ❌ Нет аналитики и статистики

---

## 🎯 Цели реализации

1. **Единая база пользователей** — все методы регистрации сохраняют пользователя в БД
2. **Связывание аккаунтов** — если пользователь регистрируется разными способами (email + кошелек), связать их
3. **Аналитика и статистика** — видеть количество пользователей, методы регистрации, активность
4. **История активности** — отслеживать действия пользователей

---

## 🏗️ Архитектура решения

### Текущая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Методы регистрации                       │
├─────────────────────────────────────────────────────────────┤
│  Email/Google OAuth         │      MetaMask Wallet          │
│  (NextAuth)                 │      (Cookie-based)           │
│                             │                               │
│  ✅ Сохраняется в БД        │      ❌ Не сохраняется        │
│  ✅ users, accounts,        │      ❌ Только cookie          │
│     sessions таблицы         │                               │
└─────────────────────────────────────────────────────────────┘
```

### Целевая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│              Единая система учета пользователей              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Email/Google    │         │  MetaMask        │          │
│  │  OAuth           │────────►│  Wallet          │          │
│  │                  │         │                  │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        ▼                                     │
│              ┌──────────────────────┐                        │
│              │   Таблица users      │                        │
│              │  (единая для всех)   │                        │
│              └──────────────────────┘                        │
│                        │                                     │
│                        ▼                                     │
│        ┌──────────────────────────────────┐                 │
│        │  Аналитика и статистика          │                 │
│        │  (внешний сервис + БД)           │                 │
│        └──────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Структура данных

### Таблица `users` (уже существует)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMP,
  image TEXT,

  -- Custom fields
  auth_type TEXT DEFAULT 'email' CHECK (auth_type IN ('email', 'wallet')),
  wallet_address TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Изменения в схеме

**Опция 1: Расширить текущую таблицу** (рекомендуется)

- Добавить поле `last_login_at` для отслеживания последней активности
- Добавить поле `login_count` для подсчета входов
- Добавить поле `registration_method` для детальной статистики (`email`, `google`, `wallet`)

**Опция 2: Создать отдельную таблицу `user_activity`**

- Хранить историю входов
- Хранить действия пользователей
- Более гибкая структура для аналитики

---

## 🔧 План реализации

### Этап 1: Подготовка базы данных (1-2 часа)

#### 1.1. Миграция для расширения таблицы users

**Файл:** `lib/database/migrations/add-user-tracking-fields.sql`

```sql
-- Add fields for user tracking
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registration_method TEXT CHECK (registration_method IN ('email', 'google', 'wallet'));

-- Update existing records
UPDATE users
SET registration_method = 'email'
WHERE registration_method IS NULL AND email IS NOT NULL;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_registration_method ON users(registration_method);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
```

#### 1.2. Создание таблицы user_activity (опционально, для детальной аналитики)

**Файл:** `lib/database/migrations/create-user-activity-table.sql`

```sql
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'wallet_connect', 'transaction', 'request_created')),
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
```

### Этап 2: API для регистрации пользователей с кошельком (2-3 часа)

#### 2.1. Создание функции в queries.ts

**Файл:** `lib/database/user-queries.ts` (новый файл)

```typescript
import { db } from "./drizzle";
import { users } from "./auth-schema";
import { eq, or } from "drizzle-orm";

export interface CreateWalletUserData {
  walletAddress: `0x${string}`;
  email?: string;
  name?: string;
}

export interface UpdateUserLoginData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create or update user with wallet address
 * If user exists by email, link wallet to existing account
 * If user exists by wallet, update last login
 * Otherwise, create new user
 */
export async function upsertWalletUser(
  data: CreateWalletUserData,
): Promise<{ id: string; isNewUser: boolean }> {
  const { walletAddress, email, name } = data;

  // Check if user exists by wallet address
  const existingWalletUser = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);

  if (existingWalletUser.length > 0) {
    // Update last login
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        loginCount: existingWalletUser[0].loginCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingWalletUser[0].id));

    return { id: existingWalletUser[0].id, isNewUser: false };
  }

  // Check if user exists by email (to link wallet to existing account)
  if (email) {
    const existingEmailUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingEmailUser.length > 0) {
      // Link wallet to existing email account
      await db
        .update(users)
        .set({
          walletAddress,
          authType: "wallet", // Update auth type
          lastLoginAt: new Date(),
          loginCount: existingEmailUser[0].loginCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingEmailUser[0].id));

      return { id: existingEmailUser[0].id, isNewUser: false };
    }
  }

  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      walletAddress,
      email: email || null,
      name: name || null,
      authType: "wallet",
      registrationMethod: "wallet",
      lastLoginAt: new Date(),
      loginCount: 1,
    })
    .returning({ id: users.id });

  return { id: newUser.id, isNewUser: true };
}

/**
 * Log user activity
 */
export async function logUserActivity(
  userId: string,
  activityType: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string,
) {
  // If user_activity table exists
  const { pool } = await import("./drizzle");
  await pool.query(
    `INSERT INTO user_activity (user_id, activity_type, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, activityType, JSON.stringify(metadata || {}), ipAddress || null, userAgent || null],
  );
}

/**
 * Get user statistics
 */
export async function getUserStatistics() {
  const { pool } = await import("./drizzle");
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(DISTINCT CASE WHEN auth_type = 'wallet' THEN id END) as wallet_users,
      COUNT(DISTINCT CASE WHEN auth_type = 'email' THEN id END) as email_users,
      COUNT(DISTINCT CASE WHEN registration_method = 'email' THEN id END) as email_registrations,
      COUNT(DISTINCT CASE WHEN registration_method = 'google' THEN id END) as google_registrations,
      COUNT(DISTINCT CASE WHEN registration_method = 'wallet' THEN id END) as wallet_registrations,
      COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '24 hours' THEN id END) as active_24h,
      COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '7 days' THEN id END) as active_7d,
      COUNT(DISTINCT CASE WHEN last_login_at >= NOW() - INTERVAL '30 days' THEN id END) as active_30d
    FROM users
  `);

  return result.rows[0];
}
```

#### 2.2. Создание API endpoint

**Файл:** `app/api/user/register-wallet/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { upsertWalletUser, logUserActivity } from "@/lib/database/user-queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, email, name } = body;

    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    // Get IP address and user agent
    const ipAddress =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create or update user
    const { id: userId, isNewUser } = await upsertWalletUser({
      walletAddress: walletAddress as `0x${string}`,
      email,
      name,
    });

    // Log activity
    try {
      await logUserActivity(
        userId,
        isNewUser ? "registration" : "login",
        {
          method: "wallet",
          walletAddress,
        },
        ipAddress,
        userAgent,
      );
    } catch (activityError) {
      // Don't fail if activity logging fails
      console.error("Failed to log activity:", activityError);
    }

    return NextResponse.json({
      success: true,
      userId,
      isNewUser,
    });
  } catch (error) {
    console.error("Error registering wallet user:", error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
```

### Этап 3: Интеграция с процессом подключения MetaMask (1-2 часа)

#### 3.1. Обновление use-wallet-connection.ts

**Изменения в:** `hooks/use-wallet-connection.ts`

Добавить вызов API после успешного подключения:

```typescript
// After successful connection
const handleConnect = useCallback(async () => {
  // ... existing connection code ...

  try {
    await connectAsync({
      connector: metaMaskConnector,
      chainId: DEFAULT_CHAIN.id,
    });

    // Register user in database
    if (address) {
      try {
        const response = await fetch("/api/user/register-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            // Optionally send email if available
            // email: userEmail,
          }),
        });

        if (!response.ok) {
          console.error("Failed to register wallet user");
        } else {
          const data = await response.json();
          console.log("User registered:", data);
        }
      } catch (registerError) {
        // Don't fail connection if registration fails
        console.error("Error registering user:", registerError);
      }
    }
  } catch (error) {
    // ... existing error handling ...
  }
}, [connectAsync, metaMaskConnector, address]);
```

#### 3.2. Обновление login page

**Изменения в:** `app/login/page.tsx`

Убедиться, что после подключения MetaMask вызывается регистрация:

```typescript
const handleMetaMaskConnect = async () => {
  try {
    if (isConnected && address) {
      // Register user in database
      await fetch("/api/user/register-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
        }),
      });

      Cookies.set("metamask_connected", "true", { expires: 7 });
      toast.success(t("login.walletConnected"));
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      await connect();
    }
  } catch (error) {
    // ... error handling ...
  }
};
```

### Этап 4: Обновление NextAuth для логирования активности (1 час)

#### 4.1. Обновление auth.ts

**Изменения в:** `lib/auth.ts`

Добавить логирование в события NextAuth:

```typescript
events: {
  async signIn({ user, account, isNewUser }) {
    // Update last login
    if (user.id) {
      try {
        const { pool } = await import("@/lib/database/drizzle");
        await pool.query(
          `UPDATE users
           SET last_login_at = CURRENT_TIMESTAMP,
               login_count = login_count + 1
           WHERE id = $1`,
          [user.id],
        );
      } catch (error) {
        console.error("Failed to update user login:", error);
      }
    }

    // Log activity
    try {
      await logUserActivity(
        user.id,
        isNewUser ? "registration" : "login",
        {
          method: account?.provider || "email",
          provider: account?.provider,
        },
      );
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  },
  // ... other events ...
}
```

### Этап 5: Создание панели статистики пользователей (2-3 часа)

#### 5.1. API endpoint для статистики

**Файл:** `app/api/user/statistics/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getUserStatistics } from "@/lib/database/user-queries";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    // Check if user is admin (add your admin check logic)
    // For now, allow anyone authenticated to view stats
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getUserStatistics();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
```

#### 5.2. Компонент статистики (опционально)

**Файл:** `components/admin/user-statistics.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface UserStats {
  total_users: number;
  wallet_users: number;
  email_users: number;
  email_registrations: number;
  google_registrations: number;
  wallet_registrations: number;
  active_24h: number;
  active_7d: number;
  active_30d: number;
}

export function UserStatistics() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/statistics")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching statistics:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No statistics available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <h3>Total Users</h3>
        <p className="text-2xl font-bold">{stats.total_users}</p>
      </Card>
      <Card>
        <h3>Registration Methods</h3>
        <ul>
          <li>Email: {stats.email_registrations}</li>
          <li>Google: {stats.google_registrations}</li>
          <li>Wallet: {stats.wallet_registrations}</li>
        </ul>
      </Card>
      <Card>
        <h3>Active Users</h3>
        <ul>
          <li>Last 24h: {stats.active_24h}</li>
          <li>Last 7 days: {stats.active_7d}</li>
          <li>Last 30 days: {stats.active_30d}</li>
        </ul>
      </Card>
    </div>
  );
}
```

---

## 🔌 Интеграция с внешними сервисами

### Рекомендуемые сервисы для аналитики

#### 1. **PostHog** (рекомендуется) ⭐

**Преимущества:**

- ✅ Бесплатный план до 1M событий/месяц
- ✅ Product analytics + feature flags
- ✅ Self-hosted опция
- ✅ GDPR compliant
- ✅ Простая интеграция

**Установка:**

```bash
npm install posthog-js
```

**Интеграция:**

```typescript
// lib/analytics/posthog.ts
import posthog from "posthog-js";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
  });
}

export { posthog };
```

**Использование:**

```typescript
// Track user registration
posthog.identify(userId, {
  email: user.email,
  authType: user.authType,
  registrationMethod: "wallet",
});

posthog.capture("user_registered", {
  method: "wallet",
  walletAddress: address,
});
```

#### 2. **Mixpanel**

**Преимущества:**

- ✅ Мощная аналитика
- ✅ Когортный анализ
- ✅ Бесплатный план до 20M событий/месяц

**Недостатки:**

- ❌ Может быть избыточно для простых задач

#### 3. **Segment**

**Преимущества:**

- ✅ Централизованное управление событиями
- ✅ Интеграция с множеством сервисов

**Недостатки:**

- ❌ Дорогой для стартапов

#### 4. **Простое решение на базе БД** (для начала)

Можно начать с таблицы `user_activity` в БД и добавить внешний сервис позже.

---

## 📝 Чеклист реализации

### Этап 1: База данных

- [ ] Создать миграцию для расширения таблицы `users`
- [ ] (Опционально) Создать таблицу `user_activity`
- [ ] Применить миграции к БД
- [ ] Проверить индексы

### Этап 2: API и функции

- [ ] Создать `lib/database/user-queries.ts`
- [ ] Реализовать `upsertWalletUser`
- [ ] Реализовать `logUserActivity`
- [ ] Реализовать `getUserStatistics`
- [ ] Создать API endpoint `/api/user/register-wallet`
- [ ] Создать API endpoint `/api/user/statistics`

### Этап 3: Интеграция

- [ ] Обновить `hooks/use-wallet-connection.ts`
- [ ] Обновить `app/login/page.tsx`
- [ ] Обновить `lib/auth.ts` для логирования активности OAuth

### Этап 4: UI (опционально)

- [ ] Создать компонент статистики
- [ ] Добавить страницу админки для просмотра пользователей
- [ ] Добавить таблицу пользователей

### Этап 5: Внешний сервис

- [ ] Выбрать сервис аналитики (PostHog рекомендуется)
- [ ] Установить и настроить
- [ ] Интегрировать трекинг событий

### Этап 6: Тестирование

- [ ] Протестировать регистрацию через кошелек
- [ ] Протестировать связывание email + кошелек
- [ ] Протестировать статистику
- [ ] Протестировать логирование активности

### Этап 7: Документация

- [ ] Обновить `docs/architecture.md`
- [ ] Добавить описание системы учета пользователей
- [ ] Создать инструкцию по использованию аналитики

---

## 🔒 Безопасность и приватность

### Меры безопасности

1. **Валидация данных:**
   - Проверка формата wallet address
   - Санитизация email
   - Ограничение длины полей

2. **Rate limiting:**
   - Ограничение частоты регистраций с одного IP
   - Защита от спама

3. **Приватность:**
   - Не логировать приватные ключи
   - Маскировать wallet addresses в логах
   - GDPR compliance (если требуется)

4. **Авторизация:**
   - Статистика доступна только авторизованным пользователям
   - Админские функции — только для админов

---

## 📊 Примеры использования

### Получение статистики пользователей

```typescript
// Server Component
import { getUserStatistics } from "@/lib/database/user-queries";

export default async function AdminPage() {
  const stats = await getUserStatistics();

  return (
    <div>
      <h1>User Statistics</h1>
      <p>Total Users: {stats.total_users}</p>
      <p>Wallet Users: {stats.wallet_users}</p>
      <p>Email Users: {stats.email_users}</p>
    </div>
  );
}
```

### Отслеживание регистрации в аналитике

```typescript
// After successful wallet connection
import { posthog } from "@/lib/analytics/posthog";

posthog.identify(userId, {
  walletAddress: address,
  authType: "wallet",
});

posthog.capture("wallet_connected", {
  walletAddress: address,
  chainId: chainId,
});
```

---

## 🚀 Приоритизация

### Must Have (MVP)

1. ✅ Миграция БД для расширения таблицы `users`
2. ✅ API endpoint для регистрации пользователей с кошельком
3. ✅ Интеграция с процессом подключения MetaMask
4. ✅ Обновление NextAuth для логирования активности

### Should Have

5. ⚪ Таблица `user_activity` для детальной аналитики
6. ⚪ API endpoint для статистики
7. ⚪ Компонент статистики

### Nice to Have

8. ⚪ Интеграция с внешним сервисом аналитики (PostHog)
9. ⚪ Админ панель для просмотра пользователей
10. ⚪ Экспорт данных пользователей

---

## ⏱️ Оценка времени

| Этап                | Время    | Приоритет    |
| ------------------- | -------- | ------------ |
| Подготовка БД       | 1-2 часа | Must Have    |
| API и функции       | 2-3 часа | Must Have    |
| Интеграция          | 1-2 часа | Must Have    |
| Обновление NextAuth | 1 час    | Must Have    |
| Статистика API      | 1-2 часа | Should Have  |
| UI компоненты       | 2-3 часа | Should Have  |
| Внешний сервис      | 2-3 часа | Nice to Have |
| Тестирование        | 2-3 часа | Must Have    |
| Документация        | 1 час    | Must Have    |

**Общее время (MVP):** 8-11 часов  
**Общее время (полная реализация):** 13-19 часов

---

## 📚 Дополнительные ресурсы

- [PostHog Documentation](https://posthog.com/docs)
- [NextAuth.js Events](https://next-auth.js.org/configuration/events)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

---

**Версия плана:** 1.0  
**Дата создания:** 2025-01-XX  
**Статус:** Готов к реализации



