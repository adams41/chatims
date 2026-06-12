WITH ranked_user1 AS (
    SELECT chat_id,
           ROW_NUMBER() OVER (PARTITION BY user1_id ORDER BY started_at DESC) AS rn
    FROM chats
    WHERE status = 'ACTIVE'
)
UPDATE chats SET status = 'ENDED'
WHERE chat_id IN (SELECT chat_id FROM ranked_user1 WHERE rn > 1);

WITH ranked_user2 AS (
    SELECT chat_id,
           ROW_NUMBER() OVER (PARTITION BY user2_id ORDER BY started_at DESC) AS rn
    FROM chats
    WHERE status = 'ACTIVE'
)
UPDATE chats SET status = 'ENDED'
WHERE chat_id IN (SELECT chat_id FROM ranked_user2 WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS uq_chats_user1_active
    ON chats (user1_id) WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS uq_chats_user2_active
    ON chats (user2_id) WHERE status = 'ACTIVE';
