-- Проверка реальных имен колонок в базе данных
-- Выполните этот запрос, чтобы увидеть ТОЧНЫЕ имена колонок

-- Проверить все колонки в accounts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- Проверить все колонки в sessions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- Проверить foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('accounts', 'sessions')
ORDER BY tc.table_name, kcu.column_name;

