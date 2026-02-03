# Настройка Email для рассылки

## 📧 Настройка Gmail для отправки email

### Шаг 1: Создание App Password в Gmail

1. Перейдите в Google Account: https://myaccount.google.com/
2. Откройте раздел "Безопасность"
3. Включите 2-Step Verification (если не включен)
4. Перейдите в "App passwords" (Пароли приложений)
5. Выберите "Mail" и устройство
6. Создайте пароль - скопируйте его (16 символов)

### Шаг 2: Настройка переменных окружения

Добавьте в `.env.local`:

```bash
# Email configuration
EMAIL_USER=support@euro-coin.eu
EMAIL_PASSWORD=your_app_password_here

# Newsletter auth
NEWSLETTER_AUTH_TOKEN=your_secure_random_token_here
```

### Шаг 3: Проверка работы

После настройки, проверьте отправку email:

```bash
curl -X POST http://localhost:3000/api/newsletter/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🔐 Безопасность

- ✅ Не храните пароли в коде - используйте переменные окружения
- ✅ Используйте App Password, а не основной пароль Gmail
- ✅ Храните `.env.local` в `.gitignore`
- ✅ Используйте токен авторизации для API

## 📤 Workflow

### Для пользователей:

1. Нажать кнопку "Рассылка" на сайте
2. Ввести email в модальном окне
3. Получить код на email
4. Ввести 6-значный код
5. Подписка подтверждена ✅

### Для админа:

1. Открыть Telegram-бот
2. Написать `/newsletter`
3. Увидеть количество подписчиков
4. Написать текст рассылки
5. Отправить рассылку на все email подписчиков

## 🗄️ Схема базы данных

### Таблица: newsletter_subscribers

```sql
email VARCHAR(255) - Email подписчика (уникальный)
chat_id VARCHAR(255) - ID в Telegram (опционально)
verified BOOLEAN - Подтвержден ли email
verification_code VARCHAR(6) - Код подтверждения
code_expires_at TIMESTAMP - Срок действия кода
is_active BOOLEAN - Активна ли подписка
language VARCHAR(10) - Язык (ru/en)
```

## 📊 API Endpoints

### POST /api/newsletter/send-code

Отправляет код подтверждения на email

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true
}
```

### POST /api/newsletter/verify-code

Проверяет код подтверждения

**Request:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "verified": true
}
```

### POST /api/newsletter/send-email

Отправляет рассылку на все email (для админа)

**Request:**

```json
{
  "message": "Текст рассылки",
  "authToken": "your_token"
}
```

**Response:**

```json
{
  "success": true,
  "total": 150,
  "sent": 145,
  "failed": 5
}
```

## 🤖 Telegram команды для админа

- `/newsletter` - начать процесс отправки рассылки
- После команды отправить текст рассылки обычным сообщением
- Бот отправит рассылку на все email подписчиков

## ⚙️ Использование

### Полный workflow:

**Пользователь:**

1. Заходит на сайт
2. Листает вниз к секции "Контакт и начало процедуры"
3. Нажимает "Рассылка"
4. Вводит email в модальном окне
5. Получает код на почту
6. Вводит код и подписывается

**Админ:**

1. Открывает Telegram-бот
2. Пишет `/newsletter`
3. Получает количество подписчиков
4. Отправляет текст рассылки следующим сообщением
5. Бот отправляет рассылку на все email подписчиков

## 📝 Важные замечания

- Код подтверждения действителен 5 минут
- Email уникальны - нельзя подписаться дважды
- Админ получает статистику отправки (отправлено/ошибок)
- Все email отправляются от `support@euro-coin.eu`








