# План реализации рассылки (Исправленная версия)

## 🎯 Правильный workflow

1. Пользователь нажимает "Рассылка" на сайте
2. Открывается модальное окно с полем email
3. Пользователь вводит email
4. На email отправляется код подтверждения (6 цифр)
5. Пользователь вводит код в модалке
6. После подтверждения email сохраняется в БД
7. Админ через Telegram-бот делает рассылку на email всех подписчиков

## 📋 Этапы реализации

### Этап 1: Создание модального окна

- [ ] Компонент `NewsletterModal` для подписки
- [ ] Поля: email, код подтверждения
- [ ] Валидация email
- [ ] Отправка кода на email через API

### Этап 2: Email верификация

- [ ] API `/api/newsletter/send-code` - отправка кода
- [ ] API `/api/newsletter/verify-code` - проверка кода
- [ ] Код генерируется (6 цифр)
- [ ] Код хранится временно (5 минут)

### Этап 3: Подписка на рассылку

- [ ] API `/api/newsletter/subscribe` - сохранение в БД
- [ ] После проверки кода email сохраняется
- [ ] Обновить схему БД - добавить поле `email`

### Этап 4: Обновить схему БД

```sql
ALTER TABLE newsletter_subscribers ADD COLUMN email VARCHAR(255);
ALTER TABLE newsletter_subscribers ADD COLUMN verification_code VARCHAR(6);
ALTER TABLE newsletter_subscribers ADD COLUMN code_expires_at TIMESTAMP;
ALTER TABLE newsletter_subscribers ADD COLUMN verified BOOLEAN DEFAULT FALSE;
```

### Этап 5: Рассылка через Telegram-бот

- [ ] Команда `/newsletter` в боте
- [ ] Админ вводит текст рассылки
- [ ] Бот отправляет на все email подписчиков

### Этап 6: Email отправка

- [ ] Интеграция с email сервисом (SendGrid/Mailgun/Nodemailer)
- [ ] Конфигурация SMTP
- [ ] Отправка на `support@euro-coin.eu` и копия подписчику

## 🔧 Технические детали

### Email сервис

- Использовать Nodemailer или SendGrid
- Конфигурация SMTP через Gmail SMTP
- Отправка с `support@euro-coin.eu`

### Безопасность

- Код верификации: 6 цифр, expires 5 минут
- Rate limiting: максимум 3 попытки ввода кода
- Email валидация
- Хеширование кодов в БД

### Структура БД

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  chat_id VARCHAR(255), -- опционально для Telegram
  verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(6),
  code_expires_at TIMESTAMP,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📁 Файлы для создания

```
components/
  modal/
    newsletter-modal.tsx      # Модальное окно подписки

app/
  api/
    newsletter/
      send-code/
        route.ts              # Отправка кода на email
      verify-code/
        route.ts              # Проверка кода
      subscribe/
        route.ts              # Сохранение подписчика
    telegram-webhook/
      route.ts                # Обновить - добавить команду /newsletter

lib/
  database/
    newsletter-schema.sql     # Обновить схему
    newsletter-queries.ts    # Обновить функции

lib/
  email/
    transporter.ts            # Конфигурация Nodemailer
    templates.ts              # Шаблоны писем
```








