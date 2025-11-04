-- Умная миграция: проверяет текущее состояние и применяет нужные изменения
-- Выполните этот скрипт вместо предыдущего

-- ============================================================================
-- ШАГ 1: Проверка и переименование колонки в accounts
-- ============================================================================
DO $$
BEGIN
  -- Проверить, есть ли user_id (snake_case)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE accounts RENAME COLUMN user_id TO "userId";
    RAISE NOTICE '✅ Переименовано: accounts.user_id → accounts.userId';
  -- Проверить, есть ли уже userId (camelCase)
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'userId'
  ) THEN
    RAISE NOTICE '✅ Колонка accounts.userId уже существует, пропускаем';
  ELSE
    RAISE WARNING '⚠️  Колонка user_id или userId не найдена в таблице accounts!';
  END IF;
END $$;

-- ============================================================================
-- ШАГ 2: Проверка и переименование колонки в sessions
-- ============================================================================
DO $$
BEGIN
  -- Проверить, есть ли user_id (snake_case)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sessions RENAME COLUMN user_id TO "userId";
    RAISE NOTICE '✅ Переименовано: sessions.user_id → sessions.userId';
  -- Проверить, есть ли уже userId (camelCase)
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'userId'
  ) THEN
    RAISE NOTICE '✅ Колонка sessions.userId уже существует, пропускаем';
  ELSE
    RAISE WARNING '⚠️  Колонка user_id или userId не найдена в таблице sessions!';
  END IF;
END $$;

-- ============================================================================
-- ШАГ 3: Обновление индексов для accounts
-- ============================================================================
-- Удалить старый индекс (если существует)
DROP INDEX IF EXISTS idx_accounts_user_id;
DROP INDEX IF EXISTS idx_accounts_userId; -- На случай, если уже есть

-- Создать новый индекс с правильным именем
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts("userId");

-- ============================================================================
-- ШАГ 4: Обновление индексов для sessions
-- ============================================================================
-- Удалить старый индекс (если существует)
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_userId; -- На случай, если уже есть

-- Создать новый индекс с правильным именем
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions("userId");

-- ============================================================================
-- ШАГ 5: Проверка результата
-- ============================================================================
SELECT 
    'accounts' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name IN ('user_id', 'userId')
UNION ALL
SELECT 
    'sessions' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name IN ('user_id', 'userId');

