-- Add more diverse bot partners for better matchmaking experience.
-- Bots only added if they don't already exist (idempotent via ON CONFLICT DO NOTHING).

INSERT INTO users (keycloak_id, name, email, age, gender, photo_path, preferences_set,
                   whatsapp_number, telegram_handle, viber_number,
                   preferred_gender, min_age, max_age, is_bot, last_seen_at)
VALUES
    ('bot-mia',     'Mia',     'mia@chatims.local',     22, 'FEMALE', NULL, TRUE, '+10000000010', NULL,           NULL,            NULL,     18, 30, TRUE, NOW()),
    ('bot-emma',    'Emma',    'emma@chatims.local',     26, 'FEMALE', NULL, TRUE, NULL, '@emma_vibes',           NULL,            'MALE',   20, 35, TRUE, NOW()),
    ('bot-chloe',   'Chloe',   'chloe@chatims.local',   29, 'FEMALE', NULL, TRUE, NULL, NULL,                    '+10000000012',  NULL,     24, 40, TRUE, NOW()),
    ('bot-zoe',     'Zoe',     'zoe@chatims.local',     23, 'FEMALE', NULL, TRUE, '+10000000013', '@zoe_chat',   NULL,            NULL,     18, 32, TRUE, NOW()),
    ('bot-olivia',  'Olivia',  'olivia@chatims.local',  31, 'FEMALE', NULL, TRUE, NULL, '@olivia_real',          '+10000000014',  'MALE',   25, 45, TRUE, NOW()),
    ('bot-ava',     'Ava',     'ava@chatims.local',     25, 'FEMALE', NULL, TRUE, '+10000000015', NULL,           NULL,            NULL,     22, 38, TRUE, NOW()),
    ('bot-james',   'James',   'james@chatims.local',   28, 'MALE',   NULL, TRUE, NULL, '@james_dev',            NULL,            'FEMALE', 20, 38, TRUE, NOW()),
    ('bot-oliver',  'Oliver',  'oliver@chatims.local',  32, 'MALE',   NULL, TRUE, '+10000000017', NULL,          '+10000000017b', 'FEMALE', 24, 42, TRUE, NOW()),
    ('bot-ethan',   'Ethan',   'ethan@chatims.local',   25, 'MALE',   NULL, TRUE, NULL, '@ethan_chat',           NULL,            NULL,     20, 36, TRUE, NOW()),
    ('bot-alex',    'Alex',    'alex@chatims.local',    30, 'MALE',   NULL, TRUE, '+10000000019', '@alex_convo', NULL,            'FEMALE', 22, 40, TRUE, NOW()),
    ('bot-lucas',   'Lucas',   'lucas@chatims.local',   27, 'MALE',   NULL, TRUE, NULL, NULL,                    '+10000000020',  NULL,     20, 38, TRUE, NOW()),
    ('bot-henry',   'Henry',   'henry@chatims.local',   35, 'MALE',   NULL, TRUE, '+10000000021', '@henry_hi',   NULL,            'FEMALE', 26, 45, TRUE, NOW())
ON CONFLICT (keycloak_id) DO NOTHING;
