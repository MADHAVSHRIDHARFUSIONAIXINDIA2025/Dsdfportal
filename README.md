# DSDF Fiber Ops

Production Next.js rebuild of the Fiber Operations Manager. The original `app.py` stays as reference only.

## What you get

- **Admin panel** at `/admin` — companies, customers/links, tickets, engineers, attendance, reports
- **Engineer extension** at `/ext` — mobile app-style field portal
- **Onboarding route** at `/ext/onboard/[token]` — admin generates the link from Engineers
- **WhatsApp** on ticket assignment and optional onboarding invite
- **MongoDB** via Mongoose
- **Tailwind** mobile-first PWA UI

## Setup

```bash
cd web
cp .env.example .env.local
```

Set `MONGODB_URI` and a long `AUTH_SECRET`. Then:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

First-run alternative: if no admin exists, `/login` shows **Create first admin**.

Default seed login:

- Email: `admin@dsdf.local`
- Password: `Admin@12345`

## Engineer onboarding

1. Admin creates the engineer with WhatsApp mobile
2. Open the engineer and tap **Generate onboarding link**
3. Engineer opens `/ext/onboard/[token]` on their phone
4. They set password and activate the field app
5. Later tickets assigned to them send WhatsApp

## WhatsApp

No business number is required. Meta provides a free test sender.

1. Create a Business app and add WhatsApp at [developers.facebook.com/apps](https://developers.facebook.com/apps).
2. **WhatsApp → API Setup** → **Generate access token** → `WHATSAPP_TOKEN`.
3. Copy the test number’s **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`.
4. Add personal number `9079886783` as a **To** test recipient and save it on the engineer.
5. Restart the Next.js server.

Without token + Phone number ID, assignment only dry-runs.

## File Attachments (S3)

Tickets support file attachments (images, PDFs, documents up to 10MB) stored in AWS S3.

**Setup:**

1. Create an AWS S3 bucket (or use existing)
2. Create IAM credentials with S3 read/write permissions
3. Add to `.env.local`:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```
4. Restart the server

Both admin and engineers can upload/view attachments on tickets. Without S3 configuration, the upload feature is disabled gracefully.

## Routes

| Path | Audience |
| --- | --- |
| `/login` | Admin |
| `/admin` | Admin operations |
| `/ext/login` | Engineer |
| `/ext/onboard/[token]` | Engineer invite |
| `/ext` | Engineer home / tickets / attendance |
