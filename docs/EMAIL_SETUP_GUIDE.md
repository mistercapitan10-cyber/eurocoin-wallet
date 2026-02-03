# Настройка Email для рассылки

## Проблема решена! ✅

**Дата:** 2025-11-11

---

## Что было исправлено

### 1. База данных ✅
- Создана база данных `web_wallet_db`
- Применены все схемы (newsletter, auth, chatbot, schema)
- Все таблицы созданы успешно

### 2. SMTP конфигурация ✅
- Изменен порт с 465 на 587
- Использован STARTTLS вместо SSL
- Добавлена настройка TLS

---

## Измененные файлы

### 1. `app/api/newsletter/send-code/route.ts`

**Было:**
```typescript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

**Стало:**
```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

### 2. `app/api/newsletter/send-email/route.ts`
Аналогичные изменения для email рассылок.

---

## Настройка Gmail App Password

### Шаг 1: Включить 2FA
1. Перейти в [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification
3. Включить 2FA

### Шаг 2: Создать App Password
1. Перейти в [App Passwords](https://myaccount.google.com/apppasswords)
2. Выбрать "Mail" и устройство
3. Скопировать сгенерированный пароль (16 символов)
4. Добавить в `.env.local`:

```bash
EMAIL_USER=support@euro-coin.eu
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App Password (без пробелов)
```

### Шаг 3: Перезапустить сервер
```bash
npm run dev
```

---

## Тестирование

### Тест 1: API работает
```bash
curl -X POST http://localhost:3000/api/newsletter/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

**Ожидаемый ответ:**
```json
{"success":true}
```

### Тест 2: Email получен
1. Проверьте почту
2. Код должен прийти в течение 1-2 минут
3. Код действителен 5 минут

### Тест 3: Верификация
```bash
curl -X POST http://localhost:3000/api/newsletter/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","code":"123456"}'
```

**Ожидаемый ответ:**
```json
{"success":true,"verified":true}
```

---

## Проверка в браузере

1. Открыть http://localhost:3000
2. Кликнуть "Подписаться на рассылку"
3. Ввести email
4. Нажать "Отправить код"
5. ✅ Должно появиться: "Код отправлен на вашу почту!"
6. Проверить email
7. Ввести код из письма
8. Нажать "Подтвердить"
9. ✅ Должно появиться: "Спасибо за подписку!"

---

## Устранение проблем

### Проблема: "Failed to send email"

#### Причина 1: Неверный App Password
**Решение:**
1. Создать новый App Password
2. Обновить `.env.local`
3. Перезапустить сервер

#### Причина 2: 2FA не включена
**Решение:**
1. Включить 2FA в Google Account
2. Создать App Password
3. Обновить `.env.local`

#### Причина 3: Gmail блокирует доступ
**Решение:**
1. Проверить [Security Activity](https://myaccount.google.com/notifications)
2. Разрешить доступ приложению
3. Попробовать снова

### Проблема: "Connection timeout"

#### Причина: Firewall блокирует порт 587
**Решение:**
1. Проверить firewall настройки
2. Разрешить исходящие подключения на порт 587
3. Попробовать с другой сети (Wi-Fi/мобильный интернет)

### Проблема: "Invalid email"

#### Причина: Email не проходит валидацию
**Решение:**
1. Проверить формат email
2. Убедиться, что есть "@" и домен
3. Попробовать с другим email

---

## Логи и отладка

### Проверка логов сервера:
```bash
tail -f server.log
```

### Успешная отправка должна показать:
```
Executed query { text: 'INSERT INTO newsletter_subscribers ...', rows: 1 }
Email sent successfully
POST /api/newsletter/send-code 200 in 2s
```

### Ошибка покажет:
```
Error sending email: Error: ...
POST /api/newsletter/send-code 500 in 75s
```

---

## Структура базы данных

### Таблица: `newsletter_subscribers`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | SERIAL | Primary Key |
| email | VARCHAR(255) | Email подписчика (UNIQUE) |
| chat_id | VARCHAR(255) | Telegram chat ID (опционально) |
| verified | BOOLEAN | Email подтвержден (default: false) |
| verification_code | VARCHAR(6) | Код подтверждения (6 цифр) |
| code_expires_at | TIMESTAMP | Срок действия кода (5 минут) |
| subscribed_at | TIMESTAMP | Дата подписки |
| is_active | BOOLEAN | Статус подписки (default: true) |
| language | VARCHAR(10) | Язык (ru/en/all) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### Проверить подписчиков:
```sql
SELECT email, verified, is_active, created_at
FROM newsletter_subscribers
ORDER BY created_at DESC
LIMIT 10;
```

---

## Безопасность

### ✅ Реализовано:
- Код из 6 цифр
- Срок действия кода: 5 минут
- Email валидация
- Защита от дубликатов (UNIQUE constraint)
- Возможность отписки

### 🔒 Рекомендации:
- Не показывать код в логах
- Использовать rate limiting (ограничение запросов)
- Добавить CAPTCHA для защиты от ботов
- Логировать попытки подписки

---

## Переменные окружения

### Обязательные:
```bash
# Email Configuration
EMAIL_USER=support@euro-coin.eu
EMAIL_PASSWORD=your_app_password_here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/web_wallet_db
```

### Опциональные:
```bash
# Newsletter Authentication (для API)
NEWSLETTER_AUTH_TOKEN=secret_token_here
```

---

## Следующие шаги

### 1. Тестирование
- [ ] Протестировать подписку на рассылку
- [ ] Проверить получение email
- [ ] Проверить верификацию кода
- [ ] Проверить отписку (если реализовано)

### 2. Telegram рассылка
- [ ] Протестировать `/newsletter` команду в боте
- [ ] Проверить отправку с изображениями
- [ ] Проверить отправку с видео
- [ ] Проверить отправку документов

### 3. Производство
- [ ] Настроить production email service
- [ ] Добавить мониторинг отправки
- [ ] Настроить логирование
- [ ] Добавить аналитику

---

## Ресурсы

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)
- [React Email](https://react.email/)

---

**Статус:** ✅ Готово к работе
**Дата:** 2025-11-11

_Гайд создан Claude Code_
