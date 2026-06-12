ALTER TABLE users ADD COLUMN intent VARCHAR(16);

CREATE INDEX idx_users_intent ON users(intent);
