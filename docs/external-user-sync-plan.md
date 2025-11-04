# План интеграции синхронизации пользователей с внешним сервисом

## 📋 Обзор

Интеграция внешнего сервиса управления пользователями (Memberstack или аналогичный) для синхронизации данных пользователей при регистрации и обновлениях через Drizzle ORM.

**Цель:** Автоматическая синхронизация данных пользователей между внутренней БД (Drizzle) и внешним сервисом управления.

---

## 🎯 Требования

### Функциональные требования:

1. ✅ Синхронизация при регистрации (MetaMask, Google OAuth, Email)
2. ✅ Синхронизация при обновлении данных пользователя в БД
3. ✅ Обработка ошибок и retry логика
4. ✅ Логирование всех операций синхронизации
5. ✅ Возможность отключения синхронизации через переменные окружения

### Технические требования:

- Следование архитектуре проекта (Next.js 14+ App Router)
- Использование TypeScript
- Модульность и расширяемость
- Обработка ошибок без влияния на основной поток регистрации

---

## 🏗️ Архитектура решения

### 1. Структура модулей

```
lib/
├── external-services/
│   ├── types.ts              # Типы для внешних сервисов
│   ├── base-client.ts        # Базовый класс клиента
│   ├── memberstack-client.ts # Реализация для Memberstack
│   ├── sync-service.ts       # Основной сервис синхронизации
│   └── index.ts              # Экспорты
├── hooks/
│   └── use-user-sync.ts      # React hook для UI синхронизации (опционально)
└── database/
    ├── drizzle.ts
    ├── hooks/                # Drizzle hooks для синхронизации
    │   └── user-sync-hook.ts
    └── ...
```

### 2. Поток данных

```
┌─────────────────────────────────────────────────────────────┐
│                    Регистрация пользователя                  │
│  (MetaMask / Google OAuth / Email через NextAuth)           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              NextAuth Event: createUser                     │
│         (lib/auth.ts - events.createUser)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          Создание пользователя в БД (Drizzle)                │
│         (DrizzleAdapter автоматически)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│      Вызов сервиса синхронизации (userSyncService)          │
│         (lib/external-services/sync-service.ts)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Синхронизация с внешним сервисом                      │
│      (Memberstack API / другой сервис)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Детальный план реализации

### Этап 1: Создание инфраструктуры для внешних сервисов

#### 1.1 Типы и интерфейсы (`lib/external-services/types.ts`)

```typescript
// Определение общих типов для внешних сервисов
export interface ExternalUser {
  id: string;
  email?: string;
  name?: string;
  walletAddress?: string;
  authType: "wallet" | "email" | "oauth";
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  externalUserId?: string;
  error?: string;
  retryable?: boolean;
}

export interface ExternalServiceConfig {
  apiKey: string;
  apiUrl: string;
  enabled: boolean;
  timeout?: number;
  retryAttempts?: number;
}
```

#### 1.2 Базовый клиент (`lib/external-services/base-client.ts`)

```typescript
// Абстрактный базовый класс для всех внешних сервисов
export abstract class BaseExternalService {
  protected config: ExternalServiceConfig;

  abstract syncUser(user: ExternalUser): Promise<SyncResult>;
  abstract updateUser(userId: string, data: Partial<ExternalUser>): Promise<SyncResult>;
  abstract deleteUser(userId: string): Promise<SyncResult>;

  // Общие методы для retry логики
  protected async retry<T>(fn: () => Promise<T>, attempts: number): Promise<T>;
}
```

#### 1.3 Клиент Memberstack (`lib/external-services/memberstack-client.ts`)

```typescript
// Конкретная реализация для Memberstack API
export class MemberstackClient extends BaseExternalService {
  async syncUser(user: ExternalUser): Promise<SyncResult>;
  async updateUser(userId: string, data: Partial<ExternalUser>): Promise<SyncResult>;
  async deleteUser(userId: string): Promise<SyncResult>;

  // Приватные методы для работы с Memberstack API
  private async createMemberstackUser(user: ExternalUser);
  private async updateMemberstackUser(externalId: string, data: Partial<ExternalUser>);
}
```

#### 1.4 Основной сервис синхронизации (`lib/external-services/sync-service.ts`)

```typescript
// Главный сервис, который управляет синхронизацией
export class UserSyncService {
  private client: BaseExternalService;

  async syncOnCreate(user: User): Promise<void>;
  async syncOnUpdate(userId: string, updates: Partial<User>): Promise<void>;
  async syncOnDelete(userId: string): Promise<void>;

  // Обработка ошибок и логирование
  private handleSyncError(error: Error, context: string): void;
}
```

---

### Этап 2: Интеграция с NextAuth событиями

#### 2.1 Обновление `lib/auth.ts`

В событии `createUser` добавить вызов синхронизации:

```typescript
events: {
  async createUser({ user }) {
    // ... существующий код ...

    // Синхронизация с внешним сервисом
    if (process.env.EXTERNAL_SYNC_ENABLED === 'true') {
      await syncUserToExternalService(user).catch((error) => {
        // Логируем, но не прерываем процесс регистрации
        console.error('[SYNC] Failed to sync user to external service:', error);
      });
    }
  },

  // Также можно добавить для других событий
  async updateUser({ user }) {
    // Синхронизация обновлений
  },

  async deleteUser({ userId }) {
    // Синхронизация удаления
  }
}
```

#### 2.2 Создание функции синхронизации (`lib/external-services/sync-helpers.ts`)

```typescript
// Вспомогательные функции для интеграции с NextAuth
export async function syncUserToExternalService(user: NextAuthUser): Promise<void>;
export async function updateUserInExternalService(
  userId: string,
  updates: Partial<User>,
): Promise<void>;
```

---

### Этап 3: Интеграция с Drizzle ORM

#### 3.1 Drizzle hooks для синхронизации (`lib/database/hooks/user-sync-hook.ts`)

Создать middleware/hook для Drizzle, который перехватывает операции с пользователями:

```typescript
// Hook для автоматической синхронизации при обновлениях через Drizzle
export function createUserSyncHook(syncService: UserSyncService) {
  return {
    // Перехват insert операций
    afterInsert: async (user: User) => {
      await syncService.syncOnCreate(user);
    },

    // Перехват update операций
    afterUpdate: async (userId: string, updates: Partial<User>) => {
      await syncService.syncOnUpdate(userId, updates);
    },

    // Перехват delete операций
    afterDelete: async (userId: string) => {
      await syncService.syncOnDelete(userId);
    },
  };
}
```

#### 3.2 Обновление схемы БД для хранения внешнего ID

```typescript
// Добавить поле для хранения ID пользователя во внешнем сервисе
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // ... существующие поля ...
  externalUserId: text("external_user_id"), // ID во внешнем сервисе
  externalSyncedAt: timestamp("external_synced_at"),
  // ...
});
```

#### 3.3 Миграция БД для новых полей

Создать миграцию для добавления полей `external_user_id` и `external_synced_at`.

---

### Этап 4: Конфигурация и переменные окружения

#### 4.1 Добавить переменные в `.env.local`

```env
# External Service Configuration
EXTERNAL_SYNC_ENABLED=true
EXTERNAL_SERVICE_TYPE=memberstack  # memberstack, custom, etc.

# Memberstack Configuration
MEMBERSTACK_API_KEY=msk_xxxxxxxxxxxxx
MEMBERSTACK_API_URL=https://api.memberstack.com/v1

# Retry Configuration
EXTERNAL_SYNC_RETRY_ATTEMPTS=3
EXTERNAL_SYNC_TIMEOUT=5000
```

#### 4.2 Валидация конфигурации (`lib/external-services/config.ts`)

```typescript
export function validateExternalServiceConfig(): ExternalServiceConfig {
  // Проверка наличия обязательных переменных
  // Валидация форматов
  // Возврат конфигурации
}
```

---

### Этап 5: Обработка ошибок и retry логика

#### 5.1 Стратегия обработки ошибок

```typescript
// В sync-service.ts
private async syncWithRetry(user: User, operation: 'create' | 'update' | 'delete'): Promise<void> {
  const maxAttempts = this.config.retryAttempts || 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await this.performSync(user, operation);
      return; // Успешно
    } catch (error) {
      if (attempt === maxAttempts) {
        // Все попытки исчерпаны - логируем и продолжаем
        this.handleSyncError(error, `${operation} user ${user.id}`);
        return;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}
```

#### 5.2 Логирование

```typescript
// Детальное логирование всех операций
console.log('[EXTERNAL_SYNC]', {
  operation: 'create' | 'update' | 'delete',
  userId: string,
  externalUserId?: string,
  success: boolean,
  error?: string,
  duration: number
});
```

---

### Этап 6: API endpoints для ручной синхронизации (опционально)

#### 6.1 Endpoint для синхронизации одного пользователя

```typescript
// app/api/admin/sync-user/route.ts
export async function POST(request: NextRequest) {
  // Проверка прав администратора
  // Синхронизация конкретного пользователя
  // Возврат результата
}
```

#### 6.2 Endpoint для массовой синхронизации

```typescript
// app/api/admin/sync-all-users/route.ts
export async function POST(request: NextRequest) {
  // Проверка прав администратора
  // Получение всех пользователей из БД
  // Синхронизация всех пользователей
  // Возврат статистики
}
```

---

## 🔄 Поток синхронизации при регистрации

### Сценарий 1: Регистрация через MetaMask

```
1. Пользователь подключает MetaMask
2. NextAuth создает сессию
3. При первом входе NextAuth создает пользователя в БД (через DrizzleAdapter)
4. Срабатывает событие events.createUser
5. Вызывается syncUserToExternalService(user)
6. UserSyncService создает пользователя в Memberstack
7. Сохраняется externalUserId в БД
8. Логируется результат
```

### Сценарий 2: Регистрация через Google OAuth

```
1. Пользователь нажимает "Войти через Google"
2. OAuth flow завершается успешно
3. NextAuth создает/находит пользователя
4. Если новый пользователь → events.createUser
5. Синхронизация с внешним сервисом
6. Обновление БД с externalUserId
```

### Сценарий 3: Регистрация через Email

```
1. Пользователь вводит email
2. Получает письмо с ссылкой
3. Переходит по ссылке
4. NextAuth создает пользователя
5. events.createUser → синхронизация
```

---

## 🔄 Поток синхронизации при обновлении

### Сценарий: Обновление данных пользователя через Drizzle

```
1. Приложение обновляет пользователя через Drizzle:
   db.update(users).set({ name: 'New Name' }).where(eq(users.id, userId))

2. Drizzle hook послеUpdate перехватывает изменение

3. Вызывается syncService.syncOnUpdate(userId, { name: 'New Name' })

4. Обновление отправляется в Memberstack API

5. Обновляется externalSyncedAt в БД
```

---

## 📦 Структура файлов

```
lib/
└── external-services/
    ├── index.ts                    # Основные экспорты
    ├── types.ts                    # TypeScript типы
    ├── config.ts                   # Конфигурация и валидация
    ├── base-client.ts              # Базовый класс клиента
    ├── memberstack-client.ts       # Реализация Memberstack
    ├── sync-service.ts             # Главный сервис синхронизации
    ├── sync-helpers.ts             # Helper функции для NextAuth
    └── utils/
        ├── retry.ts                # Утилиты для retry
        └── logger.ts               # Логирование

lib/
└── database/
    └── hooks/
        └── user-sync-hook.ts       # Drizzle hooks для синхронизации

app/
└── api/
    └── admin/
        ├── sync-user/route.ts      # Ручная синхронизация пользователя
        └── sync-all-users/route.ts # Массовая синхронизация

scripts/
└── sync-users.ts                   # Скрипт для синхронизации всех пользователей
```

---

## ✅ Чеклист реализации

### Фаза 1: Базовая инфраструктура

- [ ] Создать типы и интерфейсы (`types.ts`)
- [ ] Создать базовый класс клиента (`base-client.ts`)
- [ ] Создать конфигурацию (`config.ts`)
- [ ] Настроить переменные окружения

### Фаза 2: Реализация Memberstack клиента

- [ ] Изучить Memberstack API документацию
- [ ] Реализовать `MemberstackClient` класс
- [ ] Реализовать методы: `syncUser`, `updateUser`, `deleteUser`
- [ ] Добавить обработку ошибок API

### Фаза 3: Интеграция с NextAuth

- [ ] Добавить вызов синхронизации в `events.createUser`
- [ ] Добавить обработку `updateUser` (если нужно)
- [ ] Добавить обработку `deleteUser` (если нужно)
- [ ] Создать helper функции (`sync-helpers.ts`)

### Фаза 4: Интеграция с Drizzle

- [ ] Добавить поля `external_user_id` и `external_synced_at` в схему
- [ ] Создать миграцию для новых полей
- [ ] Реализовать Drizzle hooks (если поддерживается)
- [ ] Альтернатива: создать wrapper функции для обновления пользователей

### Фаза 5: Обработка ошибок и retry

- [ ] Реализовать retry логику с exponential backoff
- [ ] Добавить детальное логирование
- [ ] Обработать различные типы ошибок API

### Фаза 6: Тестирование

- [ ] Написать unit тесты для клиента
- [ ] Протестировать синхронизацию при регистрации
- [ ] Протестировать синхронизацию при обновлении
- [ ] Протестировать обработку ошибок

### Фаза 7: Дополнительные функции

- [ ] API endpoints для ручной синхронизации
- [ ] Скрипт для массовой синхронизации существующих пользователей
- [ ] Мониторинг и метрики синхронизации

---

## 🔐 Безопасность

1. **API ключи:** Хранить только в переменных окружения
2. **Валидация:** Проверять данные перед отправкой во внешний сервис
3. **Rate limiting:** Ограничить частоту синхронизации
4. **Логирование:** Не логировать чувствительные данные (API ключи, пароли)

---

## 📊 Мониторинг

### Метрики для отслеживания:

- Количество успешных синхронизаций
- Количество ошибок синхронизации
- Время выполнения синхронизации
- Типы ошибок и их частота

### Логирование:

```typescript
{
  level: 'info' | 'warn' | 'error',
  operation: 'create' | 'update' | 'delete',
  userId: string,
  externalUserId?: string,
  success: boolean,
  duration: number,
  error?: string
}
```

---

## 🚀 Развертывание

1. Установить переменные окружения на сервере
2. Выполнить миграцию БД для новых полей
3. Запустить скрипт массовой синхронизации существующих пользователей (опционально)
4. Включить синхронизацию через `EXTERNAL_SYNC_ENABLED=true`

---

## 📝 Примечания

- Синхронизация не должна блокировать основной поток регистрации
- Ошибки синхронизации логируются, но не прерывают процесс
- Возможность отключить синхронизацию через переменные окружения
- Архитектура расширяема для добавления других внешних сервисов

---

**Версия:** 1.0  
**Дата создания:** 31 октября 2025  
**Статус:** План готов к реализации




