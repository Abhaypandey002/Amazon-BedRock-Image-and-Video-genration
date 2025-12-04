export const SCHEMA = `
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('text-to-video', 'image-to-video', 'text-to-image')),
  prompt TEXT NOT NULL,
  source_file_path TEXT,
  media_file_path TEXT NOT NULL,
  media_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generations_type ON generations(type);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
`;

export const MIGRATIONS: string[] = [
  // Future migrations will be added here
];
