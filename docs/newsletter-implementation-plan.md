# План реализации рассылки через Telegram

## 🎯 Цель

Добавить функционал рассылки новостей и обновлений пользователям через Telegram-бота с использованием почты `support@euro-coin.eu`.

## 📋 Этапы реализации

### Этап 1: UI - Добавление кнопки "Рассылка"

#### 1.1 Обновление компонента FAQ Section

- [x] Добавить третью кнопку "Рассылка" в секцию контакта
- [x] Добавить иконку мегафона/рассылки
- [x] Обновить layout для трех кнопок (оптимизация для мобильных)
- [x] Добавить переводы в `lib/i18n/translations.ts`

#### 1.2 Обновление переводов

Файл: `lib/i18n/translations.ts`

```typescript
faq: {
  contactCTA: {
    newsletterButton: "Рассылка"; // Russian
    newsletterButton: "Newsletter"; // English
  }
}
```

---

### Этап 2: Backend API - Интеграция с Telegram

#### 2.1 Создание схемы базы данных для подписчиков

Файл: `lib/database/newsletter-schema.sql`

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'ru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_id ON newsletter_subscribers(chat_id);
CREATE INDEX idx_is_active ON newsletter_subscribers(is_active);
```

#### 2.2 Создание API endpoint для рассылки

Файл: `app/api/newsletter/send/route.ts`

Основные функции:

- [x] Аутентификация админа (проверка токена или сессии)
- [x] Получение списка активных подписчиков
- [x] Отправка сообщений через Telegram Bot API
- [x] Обработка ошибок и rate limiting
- [x] Логирование результатов рассылки

#### 2.3 Обновление Telegram Webhook

Файл: `app/api/telegram-webhook/route.ts`

Добавить команды:

- `/subscribe` - подписка на рассылку
- `/unsubscribe` - отписка от рассылки
- `/newsletter` - информация о рассылке

---

### Этап 3: Admin Interface (Будущее)

#### 3.1 Страница админа для рассылки

Файл: `app/admin/newsletter/page.tsx`

Возможности:

- Создание нового письма
- Предпросмотр
- Выбор аудитории (по языку)
- История рассылок
- Статистика (отправлено, доставлено, открыто)

---

## 🗂️ Структура файлов

```
app/
  api/
    newsletter/
      send/
        route.ts          # API endpoint для отправки рассылки
      subscribe/
        route.ts          # Подписка/отписка через webhook
  admin/
    newsletter/
      page.tsx            # Страница админа (будущее)

components/
  faq/
    faq-section.tsx       # Обновить - добавить кнопку

lib/
  database/
    newsletter-schema.sql # SQL схема для подписчиков
    newsletter-queries.ts # Функции работы с БД

docs/
  newsletter-implementation-plan.md # Этот файл
```

---

## 🔧 Технические детали

### Telegram Bot API Integration

- Использовать библиотеку `node-telegram-bot-api`
- Rate limit: max 30 messages/second
- Добавить retry логику для failed messages
- Batch sending для оптимизации

### База данных

- Использовать существующую PostgreSQL БД
- Миграция для создания таблицы `newsletter_subscribers`
- Backup и синхронизация с Telegram

### Безопасность

- Токен авторизации для отправки рассылок
- Валидация входящих данных
- Rate limiting для API endpoint
- Логирование всех операций

### Email интеграция (support@euro-coin.eu)

- Использовать как contact point для обратной связи
- Интеграция с email сервисом для уведомлений админа
- Возможность отправки email-рассылок (опционально)

---

## 🚀 Шаги реализации

1. ✅ Создание markdown плана
2. ⏳ Обновление UI - добавление кнопки
3. ⏳ Создание схемы БД
4. ⏳ Реализация API для рассылки
5. ⏳ Интеграция с Telegram Webhook
6. ⏳ Тестирование
7. ⏳ Деплой








