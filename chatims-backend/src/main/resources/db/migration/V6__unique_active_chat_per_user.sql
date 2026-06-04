-- Backfill: end stale ACTIVE chats so the unique index below can be created.
-- For each user, keep only the most recently started ACTIVE chat (per slot) and
-- end all older ones. This mirrors the runtime behaviour of joinQueue, which
-- already ends previous active chats before creating a new one.
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

-- Prevent the same user from having two ACTIVE chats simultaneously going forward.
-- Two partial unique indexes (one per slot) — together they guarantee uniqueness
-- across both user1_id and user2_id columns when status='ACTIVE'.
CREATE UNIQUE INDEX IF NOT EXISTS uq_chats_user1_active
    ON chats (user1_id) WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS uq_chats_user2_active
    ON chats (user2_id) WHERE status = 'ACTIVE';
