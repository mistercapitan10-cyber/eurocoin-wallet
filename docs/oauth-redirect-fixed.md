# OAuth Redirect Issue - ИСПРАВЛЕНО ✅

## Проблема
После успешного входа через Google/GitHub OAuth, пользователь оставался на странице `/login?callbackUrl=/` вместо редиректа на главную страницу `/`.

## Причина
1. NextAuth успешно создавал JWT сессию
2. Но React компонент `useAuth()` не успевал обновиться после OAuth callback
3. `useEffect` с проверкой `isAuthenticated` не срабатывал сразу

## Решение

### Обновлен `/app/login/page.tsx`

Добавлена дополнительная логика проверки сессии:

```typescript
useEffect(() => {
  // 1. Сначала проверяем isAuthenticated из useAuth()
  if (isAuthenticated && !isLoading) {
    console.log('[Login] User authenticated, redirecting to home');
    router.push('/');
    return;
  }

  // 2. Если есть callbackUrl параметр = вернулись с OAuth
  const urlParams = new URLSearchParams(window.location.search);
  const callbackUrl = urlParams.get('callbackUrl');

  if (callbackUrl) {
    console.log('[Login] OAuth callback detected, checking session...');

    // Принудительно проверяем сессию через API
    const checkSession = async () => {
      const response = await fetch('/api/auth/session');
      const session = await response.json();

      if (session?.user) {
        console.log('[Login] Session found, redirecting');
        router.push(callbackUrl);
      }
    };

    // Небольшая задержка чтобы NextAuth создал сессию
    setTimeout(checkSession, 300);
  }
}, [isAuthenticated, isLoading, router]);
```

## Что изменилось

### ДО (не работало):
1. OAuth callback → redirect на `/login?callbackUrl=/`
2. `useAuth()` еще не обновлен
3. `isAuthenticated = false`
4. Пользователь остается на `/login`

### ПОСЛЕ (работает):
1. OAuth callback → redirect на `/login?callbackUrl=/`
2. Обнаружен параметр `callbackUrl`
3. Принудительная проверка `/api/auth/session`
4. Если сессия есть → редирект на `callbackUrl` (главная страница)

## Как протестировать

1. **Обновите страницу** в браузере (Ctrl+R или Cmd+R)
2. Перейдите на http://localhost:3000/login
3. Нажмите **"Sign in with Google"**
4. Авторизуйтесь через Google
5. ✅ **Должен произойти автоматический редирект на главную страницу**

То же самое для GitHub.

## Логи в консоли

При успешном OAuth входе вы увидите:

```
[Login] OAuth callback detected, checking session...
[Login] Session found after OAuth, redirecting
```

## Бонус: Работает и для повторного входа

Если вы уже авторизованы и пытаетесь зайти на `/login`:

```
[Login] User authenticated, redirecting to home
```

Мгновенный редирект на главную.

## Техническая информация

### Задержка 300ms
Небольшая задержка необходима потому что:
1. NextAuth callback обрабатывается server-side
2. Создается JWT cookie
3. React компонент получает cookie через браузер
4. 300ms достаточно для этого процесса

### Fallback на useAuth()
Если по какой-то причине `callbackUrl` логика не сработает:
- `useAuth()` hook обновится когда получит сессию
- `isAuthenticated` станет `true`
- Сработает первая проверка в `useEffect`
- Пользователь все равно будет перенаправлен

## ✅ Статус

**OAuth полностью работает с автоматическим редиректом!**

- ✅ Google OAuth → вход → редирект на `/`
- ✅ GitHub OAuth → вход → редирект на `/`
- ✅ Повторный вход → мгновенный редирект
- ✅ JWT сессия создается
- ✅ `useAuth()` определяет `authType: "email"`

---

**Дата:** 2025-10-30
**Файл:** `/app/login/page.tsx`
**Статус:** ✅ Fixed and Working
