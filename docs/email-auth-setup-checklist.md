# Чеклист для запуска Email авторизации

## ✅ Что уже реализовано

1. ✅ **NextAuth.js v5** установлен (`next-auth@5.0.0-beta.30`)
2. ✅ **Конфигурация NextAuth** (`lib/auth.ts`) - настроены Google и GitHub OAuth
3. ✅ **API Route** (`app/api/auth/[...nextauth]/route.ts`) - создан
4. ✅ **Схема базы данных** (`lib/database/auth-schema.sql`) - готова
5. ✅ **Drizzle ORM схема** (`lib/database/auth-schema.ts`) - готова
6. ✅ **Компоненты UI** (`components/auth/oauth-buttons.tsx`) - готовы
7. ✅ **Унифицированный хук** (`hooks/use-auth.ts`) - создан
8. ✅ **Типы TypeScript** (`types/auth.ts`) - определены

## ❌ Что нужно сделать

### Шаг 1: Настроить переменные окружения

Создайте/обновите `.env.local`:

```bash
# Database (уже должно быть настроено)
DATABASE_URL=postgresql://user:password@localhost:5432/eurocoin_wallet

# NextAuth обязательные переменные
NEXTAUTH_URL=http://localhost:3000  # для продакшена: https://yourdomain.com
NEXTAUTH_SECRET=<сгенерировать-ниже>

# Google OAuth 2.0 (получить: https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth (получить: https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Где получить OAuth credentials:**

#### Google OAuth:

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите "Google+ API"
4. Перейдите в "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Тип: "Web application"
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (для dev)
   - `https://yourdomain.com/api/auth/callback/google` (для prod)
7. Скопируйте Client ID и Client Secret

#### GitHub OAuth:

1. Перейдите в [GitHub Developer Settings](https://github.com/settings/developers)
2. Нажмите "New OAuth App"
3. Заполните:
   - Application name: "EuroCoin Wallet"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Скопируйте Client ID и сгенерируйте Client Secret

#### Генерация NEXTAUTH_SECRET:

```bash
# Вариант 1: через openssl
openssl rand -base64 32

# Вариант 2: через Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Вариант 3: онлайн генератор
# https://generate-secret.vercel.app/32
```

### Шаг 2: Применить миграцию базы данных

Выполните SQL миграцию для создания таблиц:

```bash
npm run auth:migrate
```

Это создаст в БД:

- `auth_users` - пользователи
- `auth_accounts` - OAuth аккаунты
- `auth_sessions` - активные сессии
- `auth_verification_tokens` - токены верификации
- `auth_authenticators` - для WebAuthn (будущее)

Проверить, что миграция прошла:

```bash
npm run auth:test
```

### Шаг 3: Включить SessionProvider

Раскомментировать импорт в `components/auth/session-provider.tsx`:

```typescript
"use client";

import type { ReactNode } from "react";
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={5 * 60}      // Refetch every 5 minutes
      refetchOnWindowFocus={true}    // Refetch on window focus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
```

### Шаг 4: Обновить middleware

Обновить `middleware.ts` для поддержки NextAuth сессий:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем сессию NextAuth
  const session = await auth();

  // Проверяем MetaMask cookie (для обратной совместимости)
  const isMetaMaskConnected = request.cookies.get("metamask_connected")?.value === "true";

  // Пользователь аутентифицирован (OAuth или MetaMask)
  const isAuthenticated = !!session?.user || isMetaMaskConnected;

  // Public paths
  const publicPaths = [
    "/login",
    "/info",
    "/_next",
    "/api",
    // ...
  ];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Если аутентифицирован и на /login - редирект на главную
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Если не аутентифицирован и не публичный путь - редирект на /login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Шаг 5: Проверить компонент Login Page

Убедиться, что `app/login/page.tsx` использует OAuthButtons:

```tsx
import { OAuthButtons, AuthDivider } from "@/components/auth";

// В JSX:
<OAuthButtons callbackUrl="/" />
<AuthDivider />
```

### Шаг 6: Тестирование

1. **Локальный запуск:**

   ```bash
   npm run dev
   ```

2. **Проверка endpoints:**
   - Откройте `http://localhost:3000/api/auth/providers`
   - Должны быть видны Google и GitHub

3. **Тест входа:**
   - Откройте `http://localhost:3000/login`
   - Нажмите "Sign in with Google" или "Sign in with GitHub"
   - Должен пройти OAuth flow
   - После успешного входа - редирект на главную страницу

## 🔍 Проверка готовности

### Environment Variables Checklist:

- [ ] `DATABASE_URL` установлен
- [ ] `NEXTAUTH_URL` установлен
- [ ] `NEXTAUTH_SECRET` сгенерирован и установлен
- [ ] `GOOGLE_CLIENT_ID` установлен
- [ ] `GOOGLE_CLIENT_SECRET` установлен
- [ ] `GITHUB_CLIENT_ID` установлен
- [ ] `GITHUB_CLIENT_SECRET` установлен

### Database Checklist:

- [ ] Миграция применена (`npm run auth:migrate`)
- [ ] Таблицы созданы (`npm run auth:test`)
- [ ] Связи между таблицами работают

### Code Checklist:

- [ ] `SessionProvider` раскомментирован и работает
- [ ] `middleware.ts` обновлен для поддержки NextAuth
- [ ] `useAuth` hook возвращает корректные данные
- [ ] OAuth кнопки отображаются на странице `/login`

### Testing Checklist:

- [ ] `/api/auth/providers` возвращает список провайдеров
- [ ] Google OAuth flow работает
- [ ] GitHub OAuth flow работает
- [ ] Сессия сохраняется после входа
- [ ] Редирект работает корректно
- [ ] Страницы защищены middleware

## 🚨 Частые проблемы

### 1. "Invalid redirect_uri"

**Решение:** Проверьте, что redirect URI в OAuth настройках совпадает с `NEXTAUTH_URL/api/auth/callback/:provider`

### 2. "Database connection failed"

**Решение:** Убедитесь, что `DATABASE_URL` корректен и БД доступна

### 3. "Module not found: Can't resolve 'next-auth/react'"

**Решение:** Убедитесь, что `next-auth` установлен: `npm install next-auth`

### 4. "SessionProvider is not configured"

**Решение:** Раскомментируйте импорт в `session-provider.tsx`

### 5. OAuth кнопки не работают

**Решение:** Проверьте, что `GOOGLE_CLIENT_ID` и `GITHUB_CLIENT_ID` установлены в `.env.local`

## 📚 Полезные ссылки

- [NextAuth.js v5 Docs](https://authjs.dev/getting-started/installation)
- [Google OAuth Setup](https://console.cloud.google.com/)
- [GitHub OAuth Setup](https://github.com/settings/developers)
- [Drizzle Adapter Docs](https://authjs.dev/reference/adapter/drizzle)







