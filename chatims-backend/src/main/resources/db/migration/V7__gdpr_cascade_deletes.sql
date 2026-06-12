ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user1_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user2_id_fkey;

ALTER TABLE chats
    ADD CONSTRAINT chats_user1_id_fkey
    FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE chats
    ADD CONSTRAINT chats_user2_id_fkey
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE;
