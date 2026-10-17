# Lumiere Reservations



## Booking confirmation emails and customer management

Booking emails are sent by the platform backend, not this frontend. See the backend repository’s `docs/booking-emails.md` for local previews, SendGrid/Gmail credentials, signed delivery webhooks and production configuration. Runtime secrets must never be added to VITE variables.

The customer page is `/s/<slug>/reservation/<private-token>`. All three booking layouts expose real manage/cancel and calendar links after confirmation. Admin reservation details show delivery status, attempt history, an email preview and explicit resend. Business policy text is edited under Settings → Astryd Reserve.

Repeatable browser checks use an in-memory backend (no Atlas, actual payment or email calls):

1. From the backend repository, run `.venv/bin/python tests/serve_reserve_fixture.py` (port 5002).
2. Here, run `npm run build` then `npm run preview -- --host localhost --port 5175 --strictPort`.
3. Run `npm run test:booking` with Chrome installed, or set `PLAYWRIGHT_CHROMIUM_PATH` to an installed Chromium executable.

The tests redirect API requests to the isolated fixture. Local demo defaults to email preview until a verified sending provider is configured.
