-- Users: add contacts, preferences, bot flag, last seen
ALTER TABLE users
    ADD COLUMN whatsapp_number    VARCHAR(64),
    ADD COLUMN telegram_handle    VARCHAR(64),
    ADD COLUMN viber_number       VARCHAR(64),
    ADD COLUMN preferred_gender   VARCHAR(16),
    ADD COLUMN min_age            INTEGER,
    ADD COLUMN max_age            INTEGER,
    ADD COLUMN is_bot             BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN last_seen_at       TIMESTAMP;

CREATE INDEX idx_users_gender_age ON users(gender, age) WHERE is_bot = FALSE;
CREATE INDEX idx_users_is_bot ON users(is_bot);

-- Chats: replace participant collection with explicit FK columns, status, timer, likes
DROP TABLE IF EXISTS chat_participants;

ALTER TABLE chats
    ADD COLUMN user1_id     BIGINT NOT NULL REFERENCES users(user_id),
    ADD COLUMN user2_id     BIGINT NOT NULL REFERENCES users(user_id),
    ADD COLUMN status       VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN started_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN ends_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN user1_liked  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN user2_liked  BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE chats
    ALTER COLUMN status DROP DEFAULT,
    ALTER COLUMN started_at DROP DEFAULT,
    ALTER COLUMN ends_at DROP DEFAULT;

CREATE INDEX idx_chats_user1_status ON chats(user1_id, status);
CREATE INDEX idx_chats_user2_status ON chats(user2_id, status);
CREATE INDEX idx_chats_ends_at_active ON chats(ends_at) WHERE status = 'ACTIVE';

-- Matchmaking queue
CREATE TABLE matchmaking_queue (
    user_id           BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    preferred_gender  VARCHAR(16),
    min_age           INTEGER NOT NULL,
    max_age           INTEGER NOT NULL,
    joined_at         TIMESTAMP NOT NULL
);

CREATE INDEX idx_queue_joined_at ON matchmaking_queue(joined_at);
