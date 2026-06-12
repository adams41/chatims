# Privacy Policy

Chatims is currently in a **closed beta phase**. Access is granted by invite code only. This policy explains what personal data we collect, why we collect it, and how we handle it under the EU General Data Protection Regulation (GDPR).

## 1. Data Controller

Chatims, Austria
Email: support@chatims.app

## 2. Data We Collect

When you create an account and use Chatims, we collect:

- **Account identity:** first name, email address, password (hashed, never stored in plain text), age, gender.
- **Profile photos:** up to three images you choose to upload (optional but recommended).
- **Contact handles:** WhatsApp number, Telegram username, or Viber number (at least one required). These are only revealed to another user after a mutual like.
- **Matching preferences:** preferred gender, age range, chat intent (e.g. Dating, Friendship), optional distance preference.
- **Location:** approximate latitude/longitude, only if you explicitly grant browser permission. Rounded before storage.
- **Theme preference:** dark or light mode.
- **Server logs:** IP address, browser user-agent, request timestamps. Retained for up to 14 days for security/abuse investigation.
- **Invite code:** the code you used to register (linked to your account for audit).

## 3. Chat Messages

Chat messages are **never written to disk**. They exist only in the backend server's memory while a chat is active, and are routed directly to the other user via WebSocket. When the chat session ends (the 7-minute timer expires or one user leaves), the in-memory copy is cleared. They are not stored in any database, log file, or backup.

The only persistent records of a chat are: the chat ID, the two participant IDs, whether both users liked each other, and the start/end timestamps.

## 4. Purpose & Legal Basis

- **Providing the service** (account creation, authentication, matchmaking, chat) — Art. 6(1)(b) GDPR.
- **Optional features** (location, profile photos) — Art. 6(1)(a) GDPR (consent, withdrawable at any time).
- **Security & abuse prevention** (rate limiting, server logs, abuse reports) — Art. 6(1)(f) GDPR.

## 5. Sharing With Third Parties

We **do not sell, rent, or share your personal data** with advertisers or analytics providers. Your contact handles are revealed only to another user after a mutual match.

Technical processors:

- **Hetzner Online GmbH** (Germany) — hosts the server, database, and uploaded photos. Data stays within the EU.
- **Keycloak** (self-hosted) — handles login, password hashing, and token issuance.

## 6. Retention

- **Account data:** retained while your account is active. Deleted on request or when you click "Delete my account".
- **Chat messages:** never written to disk; held in backend memory only during the active chat.
- **Chat metadata:** retained while the match remains active. Deleted when you remove the match or your account.
- **Server logs:** up to 14 days.
- **Invite codes:** retained for audit; can be unlinked from your account on request.
- **Abuse reports:** retained while your account is active.

## 7. Your Rights (GDPR)

You have the right to:

- Access the personal data we hold about you (Art. 15)
- Rectify inaccurate data (Art. 16)
- Erase your data (Art. 17)
- Restrict processing (Art. 18)
- Data portability — receive your data in a machine-readable format (Art. 20)
- Object to processing based on legitimate interest (Art. 21)
- Lodge a complaint with your local EU data protection authority.

**Self-service:** from your profile page you can download all your data, permanently delete your account, remove matches, and manage profile photos.

For any other request, contact support@chatims.app. We respond within 30 days as required by GDPR Art. 12(3).

## 8. Cookies & Local Storage

We do not use third-party tracking, advertising, or analytics cookies. We use your browser's localStorage to store authentication tokens, theme preference, and the "install app" prompt dismissal timestamp.

## 9. Age Requirement

Chatims is for users aged **18 or older**. By registering you confirm you are at least 18. If you become aware that a user is under 18, please report it to support@chatims.app.

## 10. Security

All connections use HTTPS (TLS 1.2+). Passwords are hashed by Keycloak and never stored by the application.

## 11. Changes to This Policy

We may update this policy as the service evolves. Material changes will be announced in the app.
