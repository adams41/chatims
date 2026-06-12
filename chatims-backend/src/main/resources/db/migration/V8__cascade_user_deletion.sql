ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user1_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user2_id_fkey;

ALTER TABLE chats
    ADD CONSTRAINT chats_user1_id_fkey
    FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE chats
    ADD CONSTRAINT chats_user2_id_fkey
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE;

DELETE FROM swipes WHERE user_id NOT IN (SELECT user_id FROM users)
                      OR target_user_id NOT IN (SELECT user_id FROM users);

ALTER TABLE swipes DROP CONSTRAINT IF EXISTS swipes_user_id_fkey;
ALTER TABLE swipes DROP CONSTRAINT IF EXISTS swipes_target_user_id_fkey;

ALTER TABLE swipes
    ADD CONSTRAINT swipes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE swipes
    ADD CONSTRAINT swipes_target_user_id_fkey
    FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE;
