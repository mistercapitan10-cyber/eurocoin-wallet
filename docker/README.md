# Docker Setup

Эта директория содержит Docker конфигурацию для запуска приложения в контейнерах.

## Окружения

### Development (Dev)
- **Web**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **База данных**: web_wallet_db

### Production (Prod)
- **Web**: http://localhost:3001
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6380
- **База данных**: web_wallet_db_prod

## Быстрый старт

### Запуск Development окружения
```bash
./docker/start-dev.sh
```

### Запуск Production окружения
```bash
./docker/start-prod.sh
```

### Остановка всех окружений
```bash
./docker/stop-all.sh
```

## Ручные команды

### Development
```bash
# Запуск
docker-compose -f docker/docker-compose.dev.yml up -d

# Остановка
docker-compose -f docker/docker-compose.dev.yml down

# Логи
docker-compose -f docker/docker-compose.dev.yml logs -f

# Перезапуск
docker-compose -f docker/docker-compose.dev.yml restart
```

### Production
```bash
# Запуск с билдом
docker-compose -f docker/docker-compose.prod.yml up -d --build

# Остановка
docker-compose -f docker/docker-compose.prod.yml down

# Логи
docker-compose -f docker/docker-compose.prod.yml logs -f

# Перезапуск
docker-compose -f docker/docker-compose.prod.yml restart
```

## Работа с базой данных

### Подключение к Dev PostgreSQL
```bash
psql -h localhost -p 5432 -U postgres -d web_wallet_db
# Пароль: postgres
```

### Подключение к Prod PostgreSQL
```bash
psql -h localhost -p 5433 -U postgres -d web_wallet_db_prod
# Пароль: postgres
```

### Работа с Redis

#### Dev Redis
```bash
redis-cli -p 6379
```

#### Prod Redis
```bash
redis-cli -p 6380
```

## Миграции

Миграции запускаются автоматически при старте контейнеров.

Если нужно запустить миграции вручную:

```bash
# Dev
docker exec -it web-wallet-web-dev npm run db:migrate

# Prod
docker exec -it web-wallet-web-prod npm run db:migrate
```

## Отладка

### Просмотр логов контейнера
```bash
# Dev
docker logs -f web-wallet-web-dev

# Prod
docker logs -f web-wallet-web-prod
```

### Подключение к контейнеру
```bash
# Dev
docker exec -it web-wallet-web-dev sh

# Prod
docker exec -it web-wallet-web-prod sh
```

### Проверка статуса
```bash
# Dev
docker-compose -f docker/docker-compose.dev.yml ps

# Prod
docker-compose -f docker/docker-compose.prod.yml ps
```

## Переменные окружения

Переменные окружения настроены в файлах `docker-compose.dev.yml` и `docker-compose.prod.yml`.

Для локальной разработки вне Docker используйте `.env.local`.

## Очистка

### Удаление контейнеров и volumes
```bash
# Dev
docker-compose -f docker/docker-compose.dev.yml down -v

# Prod
docker-compose -f docker/docker-compose.prod.yml down -v
```

### Полная очистка Docker
```bash
docker system prune -a --volumes
```

## Troubleshooting

### Порт уже занят
Если порт занят, убейте процесс:
```bash
# Найти процесс
lsof -ti:3000

# Убить процесс
kill -9 $(lsof -ti:3000)
```

### Контейнеры не запускаются
```bash
# Остановить все
docker-compose -f docker/docker-compose.dev.yml down --remove-orphans
docker-compose -f docker/docker-compose.prod.yml down --remove-orphans

# Очистить networks
docker network prune -f

# Запустить заново
./docker/start-dev.sh
```

### Проблемы с базой данных
```bash
# Пересоздать volumes
docker-compose -f docker/docker-compose.dev.yml down -v
docker-compose -f docker/docker-compose.dev.yml up -d
```
