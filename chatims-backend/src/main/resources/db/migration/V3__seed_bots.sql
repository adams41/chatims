-- Seed bot users so matchmaking has fallback partners before WebSocket / real concurrent users land.
-- Bots have synthetic keycloak_id with a 'bot-' prefix and isBot=true.

INSERT INTO users (keycloak_id, name, email, age, gender, photo_path, preferences_set,
                   whatsapp_number, telegram_handle, viber_number,
                   preferred_gender, min_age, max_age, is_bot, last_seen_at)
VALUES
    ('bot-luna',    'Luna',    'luna@chatims.local',    24, 'FEMALE', NULL, TRUE, NULL, '@luna_chat',    NULL,            'MALE',   20, 35, TRUE, NOW()),
    ('bot-sofia',   'Sofia',   'sofia@chatims.local',   28, 'FEMALE', NULL, TRUE, '+10000000002', NULL,  NULL,            NULL,     22, 40, TRUE, NOW()),
    ('bot-ella',    'Ella',    'ella@chatims.local',    31, 'FEMALE', NULL, TRUE, NULL, '@ella_says',    '+10000000003',  'MALE',   25, 45, TRUE, NOW()),
    ('bot-liam',    'Liam',    'liam@chatims.local',    27, 'MALE',   NULL, TRUE, '+10000000004', NULL,  NULL,            'FEMALE', 21, 38, TRUE, NOW()),
    ('bot-noah',    'Noah',    'noah@chatims.local',    33, 'MALE',   NULL, TRUE, NULL, '@noah_dev',     NULL,            NULL,     24, 42, TRUE, NOW()),
    ('bot-mason',   'Mason',   'mason@chatims.local',   26, 'MALE',   NULL, TRUE, NULL, NULL,            '+10000000006',  'FEMALE', 20, 36, TRUE, NOW());
