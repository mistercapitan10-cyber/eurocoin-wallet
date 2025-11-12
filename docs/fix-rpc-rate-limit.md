# Исправление ошибки HTTP 429 (Too Many Requests) от Infura

## Проблема

В продакшене возникают ошибки:
- `[hooks:useInternalBalance] Failed to load balance: Error: Failed to load internal balance snapshot`
- HTTP 429 от Infura RPC endpoint

## Причина

1. **Wagmi использует дефолтный RPC провайдер**: Если `NEXT_PUBLIC_RPC_URL` не установлен для mainnet, wagmi использует дефолтный RPC, который может быть Infura с ограниченным лимитом запросов.

2. **Много запросов к RPC**: Компоненты используют wagmi хуки (`useAccount`, `useWalletStatistics`), которые делают запросы к блокчейну. При большом количестве пользователей это приводит к превышению лимита Infura.

3. **Внутренний баланс не должен использовать RPC**: Система внутреннего баланса работает только с базой данных и не должна делать запросы к блокчейну. Но если wagmi настроен неправильно, все компоненты будут использовать ограниченный RPC.

## Решение

### 1. Исправлена конфигурация wagmi

Файл `lib/wagmi.tsx` обновлен для использования публичных RPC endpoints без лимитов в качестве fallback:

```typescript
// Используются публичные RPC без лимитов
const PUBLIC_RPC_MAINNET = "https://eth.llamarpc.com";
const PUBLIC_RPC_SEPOLIA = "https://sepolia.drpc.org";
```

### 2. Настройка переменных окружения (рекомендуется)

Для лучшей производительности рекомендуется настроить собственные RPC endpoints:

```env
# Для Mainnet (рекомендуется использовать собственный ключ)
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
# Или Alchemy
NEXT_PUBLIC_RPC_URL_MAINNET=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Для Sepolia (опционально)
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Или используйте публичные RPC (без лимитов, но может быть медленнее)
NEXT_PUBLIC_RPC_URL_MAINNET=https://eth.llamarpc.com
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.drpc.org
```

### 3. Альтернативные публичные RPC (без лимитов)

Если не хотите использовать Infura/Alchemy, можно использовать публичные RPC:

- **Mainnet:**
  - `https://eth.llamarpc.com` (используется по умолчанию)
  - `https://rpc.ankr.com/eth`
  - `https://ethereum.publicnode.com`

- **Sepolia:**
  - `https://sepolia.drpc.org` (используется по умолчанию)
  - `https://rpc.sepolia.org`

## Проверка

После применения изменений:

1. **Перезапустите приложение** в продакшене
2. **Проверьте консоль браузера** - ошибки HTTP 429 должны исчезнуть
3. **Проверьте работу внутреннего баланса** - он должен загружаться без ошибок

## Дополнительные рекомендации

### Для продакшена с высокой нагрузкой:

1. **Используйте собственный Infura/Alchemy ключ** с увеличенным лимитом
2. **Настройте кеширование** запросов к RPC (уже реализовано через React Query в wagmi)
3. **Мониторьте использование RPC** через дашборды Infura/Alchemy

### Мониторинг:

- Infura: https://infura.io/dashboard
- Alchemy: https://dashboard.alchemy.com/

## Важно

- **Внутренний баланс НЕ требует RPC**: Система внутреннего баланса работает только с базой данных и не делает запросов к блокчейну
- **RPC нужен только для**: Отображения ончейн баланса токенов и истории транзакций через MetaMask
- **Ошибка HTTP 429 не влияет на внутренний баланс напрямую**, но может влиять на другие компоненты, использующие wagmi

