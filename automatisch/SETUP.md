# Automatisch — Self-Hosted Setup

[Automatisch](https://automatisch.io) is an open-source, self-hostable
alternative to Zapier/Make. It connects apps (Slack, Notion, Google
Sheets/Drive/Docs/Forms, Gmail, Stripe, Airtable, Mailchimp, Trello,
HubSpot, Telegram, Webhooks, HTTP requests, and 80+ more) into
no-code automation flows, with all data staying on your own server.

Upstream repo: https://github.com/automatisch/automatisch
Docs: https://automatisch.io/docs

This folder runs Automatisch via the official published Docker image
(`automatischio/automatisch`) instead of vendoring the upstream
source tree — the upstream repo is a large monorepo (backend, web,
docs, e2e-tests) that isn't needed just to self-host it.

## Quick start

```bash
cd automatisch
cp .env.example .env

# Generate the two secrets and paste them into .env
openssl rand -base64 36   # -> ENCRYPTION_KEY
openssl rand -base64 36   # -> WEBHOOK_SECRET_KEY
openssl rand -base64 36   # -> APP_SECRET_KEY

docker compose up -d
```

Then open [http://localhost:3000](http://localhost:3000). First login:

- Email: `user@automatisch.io`
- Password: `sample`

Change both immediately from the settings page.

## Environment variables

See [.env.example](./.env.example) for the full list. The important ones:

| Variable | Purpose |
|---|---|
| `ENCRYPTION_KEY` | Encrypts stored third-party credentials. Changing it breaks existing connections. |
| `WEBHOOK_SECRET_KEY` | Verifies incoming webhook requests. |
| `APP_SECRET_KEY` | Session/auth secret. |
| `POSTGRES_*` | Database connection (matches the bundled `postgres` service by default). |
| `REDIS_*` | Job queue connection (matches the bundled `redis` service by default). |

Never commit the real `.env` file — only `.env.example` is tracked.

## Upgrading

```bash
docker compose pull
docker compose up -d
```

## What it's useful for here

Automatisch can wire together the tools BabicA Designs already touches
without paying for Zapier/Make — e.g. Google Forms/Sheets → email/Slack
notifications, webhook → Notion/Airtable record creation, RSS/webhook
triggers into Telegram or Slack, or scheduled flows that call an HTTP
API or LLM (OpenAI/Anthropic/Mistral apps are built in). Full list of
available apps is in the upstream
[`packages/backend/src/apps`](https://github.com/automatisch/automatisch/tree/main/packages/backend/src/apps)
directory.

## Uninstall / reset

```bash
docker compose down -v   # -v also removes the Postgres/Redis/storage volumes
```
