-- Проверка текущей структуры таблиц accounts и sessions
-- Выполните эти запросы, чтобы понять, какие колонки существуют

-- Проверить колонки в таблице accounts
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name IN ('user_id', 'userId', 'userid')
ORDER BY column_name;

-- Проверить колонки в таблице sessions
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name IN ('user_id', 'userId', 'userid')
ORDER BY column_name;

-- Проверить все колонки в accounts (для отладки)
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- Проверить все колонки в sessions (для отладки)
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- Проверить индексы
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('accounts', 'sessions')
AND indexname LIKE '%user%';

