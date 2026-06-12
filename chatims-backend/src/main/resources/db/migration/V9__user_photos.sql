CREATE TABLE user_photos (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    photo_path  VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_photos_user_position UNIQUE (user_id, position)
);

CREATE INDEX idx_user_photos_user ON user_photos(user_id);

INSERT INTO user_photos (user_id, position, photo_path)
SELECT user_id, 0, photo_path
FROM users
WHERE photo_path IS NOT NULL;
