ALTER TABLE chats ADD COLUMN match_removed_at TIMESTAMP;

CREATE INDEX idx_chats_match_removed ON chats(match_removed_at);
