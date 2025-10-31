-- Создание таблицы для хранения файлов
CREATE TABLE IF NOT EXISTS request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(50) NOT NULL,
  request_type VARCHAR(20) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_data BYTEA NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys with CASCADE DELETE
  CONSTRAINT fk_exchange_request
    FOREIGN KEY (request_id)
    REFERENCES exchange_requests(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_internal_request
    FOREIGN KEY (request_id)
    REFERENCES internal_requests(id)
    ON DELETE CASCADE,

  CONSTRAINT valid_request_type
    CHECK (request_type IN ('exchange', 'internal'))
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_request_files_request_id
  ON request_files(request_id);

CREATE INDEX IF NOT EXISTS idx_request_files_request_type
  ON request_files(request_type);

-- Комментарии для документации
COMMENT ON TABLE request_files IS 'Прикрепленные файлы к заявкам';
COMMENT ON COLUMN request_files.file_data IS 'Binary данные файла (BYTEA)';
COMMENT ON COLUMN request_files.request_type IS 'Тип заявки: exchange или internal';

