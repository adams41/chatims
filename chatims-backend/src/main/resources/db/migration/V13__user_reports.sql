CREATE TABLE user_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reported_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chat_id BIGINT REFERENCES chats(chat_id) ON DELETE SET NULL,
    reason VARCHAR(32) NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_report CHECK (reporter_id <> reported_id)
);

CREATE INDEX idx_user_reports_reported ON user_reports(reported_id);
CREATE INDEX idx_user_reports_reporter ON user_reports(reporter_id);
