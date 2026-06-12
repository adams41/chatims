CREATE TABLE invite_codes (
    code VARCHAR(32) PRIMARY KEY,
    used_by_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used_at TIMESTAMP
);

CREATE INDEX idx_invite_codes_used_by ON invite_codes(used_by_user_id);
