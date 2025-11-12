# Исправление ошибки "Не удалось получить информацию о токене"

## Проблема

В продакшене отображается ошибка:
```
Не удалось получить информацию о токене. Проверьте адрес контракта и RPC.
```

На локальном проекте все работает корректно.

## Возможные причины

### 1. Неправильный адрес токена

**Проблема:** `NEXT_PUBLIC_TOKEN_ADDRESS` не установлен или содержит неправильный адрес.

**Решение:**
1. Проверьте переменную окружения в продакшене (Vercel/другой хостинг)
2. Убедитесь, что адрес правильный для нужной сети:
   - Mainnet: адрес должен существовать на Ethereum Mainnet
   - Sepolia: адрес должен существовать на Sepolia testnet

**Проверка:**
```bash
# В консоли браузера (F12) проверьте логи:
[useTokenInfo] Configuration: { tokenAddress: "0x..." }
```

### 2. Неправильный RPC URL

**Проблема:** RPC URL не установлен, недоступен или превышен rate limit.

**Решение:**
1. Проверьте переменные окружения:
   - `NEXT_PUBLIC_RPC_URL` (общий)
   - `NEXT_PUBLIC_RPC_URL_MAINNET` (для Mainnet)
   - `NEXT_PUBLIC_RPC_URL_SEPOLIA` (для Sepolia)

2. Убедитесь, что RPC URL правильный:
   - Infura: `https://mainnet.infura.io/v3/YOUR_KEY`
   - Alchemy: `https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`
   - Public RPC: `https://eth.llamarpc.com` (fallback уже настроен)

**Проверка:**
- Откройте RPC URL в браузере - должен вернуть JSON-RPC ответ
- Проверьте логи на наличие ошибок подключения

### 3. Неправильный Chain ID

**Проблема:** `NEXT_PUBLIC_TOKEN_CHAIN_ID` не совпадает с сетью токена.

**Решение:**
1. Проверьте переменную окружения:
   - Mainnet: `NEXT_PUBLIC_TOKEN_CHAIN_ID=1`
   - Sepolia: `NEXT_PUBLIC_TOKEN_CHAIN_ID=11155111`

2. Убедитесь, что Chain ID соответствует сети токена

**Проверка:**
```bash
# В консоли браузера проверьте:
[useTokenInfo] Configuration: { chainId: 1, defaultChainId: 1 }
```

### 4. Проблемы с подключением к RPC

**Проблема:** RPC провайдер недоступен или превышен rate limit.

**Решение:**
1. Система уже настроена с fallback на публичные RPC:
   - Mainnet: `https://eth.llamarpc.com`
   - Sepolia: `https://sepolia.drpc.org`

2. Если проблема сохраняется:
   - Проверьте доступность RPC провайдера
   - Получите новый API ключ для Infura/Alchemy
   - Используйте альтернативный RPC провайдер

## Диагностика

### Шаг 1: Проверьте логи в консоли браузера

Откройте консоль разработчика (F12) и ищите:

```
[useTokenInfo] Configuration: {
  isTokenConfigured: true/false,
  tokenAddress: "0x...",
  chainId: 1,
  ...
}
```

Если `isTokenConfigured: false` - проблема в `NEXT_PUBLIC_TOKEN_ADDRESS`.

### Шаг 2: Проверьте ошибки

Ищите в консоли:

```
[useTokenInfo] Error fetching token info: {
  error: "...",
  symbolError: ...,
  decimalsError: ...
}
```

Это покажет точную причину ошибки.

### Шаг 3: Проверьте переменные окружения в продакшене

#### Для Vercel:

1. Откройте проект в Vercel Dashboard
2. Перейдите в Settings → Environment Variables
3. Проверьте наличие и значения:
   - `NEXT_PUBLIC_TOKEN_ADDRESS`
   - `NEXT_PUBLIC_RPC_URL` или `NEXT_PUBLIC_RPC_URL_MAINNET`
   - `NEXT_PUBLIC_TOKEN_CHAIN_ID`
   - `NEXT_PUBLIC_TOKEN_SYMBOL` (опционально)
   - `NEXT_PUBLIC_TOKEN_DECIMALS` (опционально)

#### Для других хостингов:

Проверьте переменные окружения в панели управления хостингом.

## Решение

### Вариант 1: Проверка и исправление переменных окружения

1. Убедитесь, что все переменные установлены:
```env
NEXT_PUBLIC_TOKEN_ADDRESS=0x88F43B9f5A6d4ADEF8f80D646732F5b6153C2586
NEXT_PUBLIC_TOKEN_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.infura.io/v3/YOUR_KEY
# или
NEXT_PUBLIC_RPC_URL=https://eth.llamarpc.com
```

2. Перезапустите приложение после изменения переменных

### Вариант 2: Использование публичных RPC (fallback)

Если у вас нет API ключа для Infura/Alchemy, система автоматически использует публичные RPC:
- Mainnet: `https://eth.llamarpc.com`
- Sepolia: `https://sepolia.drpc.org`

Эти RPC уже настроены как fallback и должны работать без дополнительной настройки.

### Вариант 3: Проверка адреса токена

Убедитесь, что адрес токена правильный для нужной сети:

```bash
# Проверка на Etherscan
# Mainnet: https://etherscan.io/address/0x88F43B9f5A6d4ADEF8f80D646732F5b6153C2586
# Sepolia: https://sepolia.etherscan.io/address/YOUR_ADDRESS
```

## Что было добавлено

1. **Детальное логирование в `useTokenInfo`:**
   - Логирование конфигурации токена при загрузке
   - Логирование ошибок запросов к контракту
   - Информация об адресе, chainId, RPC

2. **Улучшенная обработка ошибок:**
   - Более информативные сообщения об ошибках
   - Логирование деталей ошибок в консоль

## Проверка после исправления

1. Откройте страницу с балансом токена
2. Откройте консоль браузера (F12)
3. Проверьте логи:
   - `[useTokenInfo] Configuration` - должна быть правильная конфигурация
   - Не должно быть ошибок `[useTokenInfo] Error fetching token info`
4. Баланс токена должен отображаться корректно

## Следующие шаги

1. ✅ Проверьте переменные окружения в продакшене
2. ✅ Проверьте логи в консоли браузера
3. ✅ Убедитесь, что адрес токена правильный для нужной сети
4. ✅ Перезапустите приложение после изменения переменных

Если проблема сохранится, скопируйте логи из консоли браузера и отправьте для дальнейшего анализа.

