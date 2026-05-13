CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    keycloak_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    age INTEGER NOT NULL,
    gender VARCHAR(16),
    photo_path VARCHAR(512),
    preferences_set BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE chats (
    chat_id BIGSERIAL PRIMARY KEY
);

CREATE TABLE chat_participants (
    chat_id BIGINT NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    participant VARCHAR(255) NOT NULL
);

CREATE INDEX idx_chat_participants_chat ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_participant ON chat_participants(participant);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    send_timestamp TIMESTAMP NOT NULL
);

CREATE INDEX idx_messages_chat ON messages(chat_id, send_timestamp);
CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE TABLE swipes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_user_id BIGINT NOT NULL,
    liked BOOLEAN NOT NULL,
    CONSTRAINT uk_swipes_user_target UNIQUE (user_id, target_user_id)
);

CREATE INDEX idx_swipes_user ON swipes(user_id);
CREATE INDEX idx_swipes_target ON swipes(target_user_id);
