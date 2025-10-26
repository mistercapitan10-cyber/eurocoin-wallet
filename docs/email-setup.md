# Email Setup для Internal Request Form

## Обзор

Форма внутренних заявок настроена для отправки email через [Resend](https://resend.com/). После заполнения и отправки формы, email автоматически отправляется на указанный адрес.

## Настройка Resend

### 1. Создание аккаунта

1. Зарегистрируйтесь на [resend.com](https://resend.com/)
2. Подтвердите email
3. Создайте API ключ в Dashboard

### 2. Добавление API ключа

Создайте файл `.env.local` (если его нет) и добавьте:

```env
# Resend API Key (required for email sending)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email Configuration
RECIPIENT_EMAIL=treasury@company.io
SENDER_EMAIL=noreply@yourdomain.com
```

**Важно:**

- `SENDER_EMAIL` должен быть домен, верифицированный в Resend
- Для тестирования можно использовать `noreply@resend.dev`
- `RECIPIENT_EMAIL` - адрес, на который будут приходить заявки

### 3. Верификация домена (опционально)

Для использования собственного домена:

1. Зайдите в Resend Dashboard
2. Перейдите в "Domains"
3. Добавьте ваш домен
4. Добавьте DNS записи (TXT и MX) в настройки вашего домена
5. Подождите верификации

## Бесплатный план Resend

### Лимиты

- **100 писем/день** - достаточно для внутреннего использования
- Безопасная доставка
- API для интеграции
- Email tracking

### После исчерпания лимита

- Можно перейти на платный план ($20/мес)
- Или использовать другие сервисы (Nodemailer с SMTP)

## Альтернатива: SMTP через Nodemailer

Если предпочитаете SMTP (Gmail, Outlook и т.д.):

### 1. Установка Nodemailer

```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

### 2. Настройка в `.env.local`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
RECIPIENT_EMAIL=treasury@company.io
```

**Для Gmail:**

- Включите "Менее безопасные приложения"
- Или создайте App Password в настройках Google Account

### 3. Обновление API Route

Замените использование Resend на Nodemailer в `app/api/submit-request/route.ts`

## Тестирование

### Локально

1. Запустите `pnpm dev`
2. Откройте форму внутренних заявок
3. Заполните и отправьте форму
4. Проверьте inbox указанного `RECIPIENT_EMAIL`

### В продакшене

- Используйте переменные окружения хостинга (Vercel, Netlify)
- Настройте домен для отправки
- Проверьте логи ошибок в Dashboard

## Структура Email

Отправляемый email включает:

- **Subject**: `[PRIORITY] Request Type - Requester`
- **HTML форматирование** с красивым дизайном
- Все данные формы
- Timestamp отправки

### Пример Subject Line

```
[HIGH] Token Withdrawal - John Doe
```

### Поля в Email

- Requester (ФИО или email)
- Department (Отдел)
- Request Type (Тип заявки)
- Priority (Приоритет: LOW/NORMAL/HIGH)
- Description (Описание задачи)

## Безопасность

### Рекомендации

- ✅ **Никогда** не публикуйте `RESEND_API_KEY` в публичных репозиториях
- ✅ Добавьте `.env.local` в `.gitignore`
- ✅ Используйте разные ключи для dev/staging/production
- ✅ Регулярно ротируйте API ключи

### Проверка ошибок

- Логи ошибок выводятся в консоль сервера
- В процессе разработки проверяйте Network tab в DevTools
- На production используйте мониторинг (Sentry, LogRocket)

## Troubleshooting

### Проблема: "Failed to send email"

**Решение:** Проверьте `RESEND_API_KEY` в `.env.local`

### Проблема: "Invalid domain"

**Решение:** Используйте `noreply@resend.dev` для теста или верифицируйте домен

### Проблема: "Rate limit exceeded"

**Решение:** Слишком много запросов. Подождите или перейдите на платный план

## Production Checklist

- [ ] API ключ настроен в переменных окружения
- [ ] Верифицирован домен для отправителя
- [ ] Тестирование отправки работает
- [ ] Логирование ошибок настроено
- [ ] Мониторинг настроен
- [ ] Backup email provider (опционально)
