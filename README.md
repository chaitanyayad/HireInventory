<div align="center">

<br/>

```
 ██╗ ██████╗ ██████╗     ████████╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗ 
 ██║██╔═══██╗██╔══██╗    ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
 ██║██║   ██║██████╔╝       ██║   ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝
██╗██║██╗ ██║██╔══██╗       ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
╚█████╔╝╚█████╔╝██████╔╝       ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
 ╚════╝  ╚════╝ ╚═════╝        ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
```

<br/>

**A job application tracker that measures the silence.**

Real-time status updates over WebSockets, Redis-cached stats, a RabbitMQ
worker for reminder emails, and Claude-powered analysis of your own history.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

<sub>Built by <a href="https://github.com/chaitanyayadav">Chaitanya Yadav</a></sub>

</div>

---

## What it does

Most trackers are a spreadsheet with a nicer font. The thing that actually
hurts about a job search is not recording what you sent — it's not knowing how
long you've been waiting, and on what.

So the central number here is **silence**: days since you applied, with no
reply. Applications sort by it. The dashboard shows the shape of your pipeline
as one proportional band rather than four counts you have to compare in your
head. When a status changes, every open tab updates without a refresh.

| | |
|---|---|
| **Dashboard** | Pipeline as a single proportional band, longest-silence ranking, recent movement. Stats served from Redis. |
| **Applications** | Dense ledger with a mono day-count gutter. Search, filter, sort — status changes in place. |
| **Detail** | One record, with the elapsed wait as the largest thing on the page. |
| **Insights** | Claude reads your full history and describes the pattern. Also drafts cover letters and interview prep. |
| **Live** | A status change in one tab appears in every other tab, via Redis pub/sub fanned out to WebSockets. |

---

## Architecture

```mermaid
flowchart TB
    subgraph client["Browser"]
        UI["React SPA<br/>(nginx)"]
    end

    subgraph api["FastAPI"]
        REST["REST routers<br/>auth · applications · dashboard · ai"]
        WS["WebSocket<br/>/ws/status"]
    end

    subgraph data["State"]
        PG[("PostgreSQL<br/>users · job_applications")]
        RD[("Redis<br/>stats cache · rate limits · pub/sub")]
        MQ[["RabbitMQ<br/>status_events"]]
    end

    WORKER["Notification worker<br/>(separate process)"]
    CLAUDE["Claude API"]

    UI -->|"REST + JWT"| REST
    UI <-->|"live events"| WS
    REST --> PG
    REST -->|"read-through cache<br/>invalidate on write"| RD
    REST -->|"durable: must happen once"| MQ
    REST -->|"fire-and-forget: only<br/>worth it if someone's looking"| RD
    RD -.->|"pub/sub fanout"| WS
    MQ --> WORKER
    WORKER -->|"SMTP"| MAIL["Reminder email"]
    REST --> CLAUDE
```

### Why a status change goes two places

This is the part worth understanding. `PATCH /applications/{id}/status`
publishes the same event twice, deliberately:

- **RabbitMQ** — a durable queue for work that must happen *exactly once*: the
  email. Manual ack with `prefetch_count=1`, so a worker crash mid-send puts
  the message back rather than losing it.
- **Redis pub/sub** — a fire-and-forget broadcast for UI that is only worth
  delivering *if someone is currently looking*. Every API process subscribes,
  so a change handled by one worker reaches a socket held by another.

Both publishes are fail-open. If RabbitMQ is down you still get your status
change; you just don't get the email.

---

## Running it

### Docker (everything, one command)

```bash
cp .env.example .env          # then set JWT_SECRET_KEY and ANTHROPIC_API_KEY
docker compose up --build
```

| Service | URL |
|---|---|
| App | http://localhost:8080 |
| API docs | http://localhost:8000/docs |
| RabbitMQ management | http://localhost:15672 (`guest` / `guest`) |

Migrations run automatically on backend start (`alembic upgrade head`, which is
idempotent). Postgres, Redis, and RabbitMQ each have a healthcheck, and the
backend waits for all three to be healthy — otherwise it races Postgres on a
cold start and exits before the database accepts connections.

### Without Docker

Needs Postgres, Redis, and RabbitMQ running locally.

```bash
# backend — from job-tracker/backend
pip install -r requirements.txt
cp .env.example .env           # fill in DATABASE_URL, REDIS_URL, JWT_Secret_Key
alembic upgrade head
uvicorn app.main:app --reload

# worker — separate terminal, same directory
python -m app.workers.notification_worker

# frontend — from job-tracker/frontend
npm install
npm run dev                    # http://localhost:5173
```

The Vite dev server proxies `/api` and `/ws` to `localhost:8000`, so the
browser stays on one origin and the JWT never rides a cross-origin request.

---

## Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | yes | `redis://host:6379/0` |
| `JWT_Secret_Key` | yes | signs the JWTs; 60-minute expiry |
| `RABBITMQ_URL` | no | defaults to `guest@localhost`; publish fails open |
| `ANTHROPIC_API_KEY` | for `/ai` | AI pages render but error without it |
| `EMAILS_ENABLED` | no | `False` prints the email to the console instead of sending |

---

## API

| Method | Path | Notes |
|---|---|---|
| `POST` | `/auth/register` | 5/min per IP |
| `POST` | `/auth/login` | returns a bearer token |
| `GET` | `/auth/me` | |
| `GET` `POST` | `/applications` | list is capped at 50 server-side |
| `GET` | `/applications/{id}` | |
| `PATCH` | `/applications/{id}/status` | the only mutation; emits both events |
| `DELETE` | `/applications/{id}` | |
| `GET` | `/dashboard/stats` | Redis-cached, invalidated on every write |
| `POST` | `/ai/analyze` · `/ai/cover-letter` · `/ai/interview-prep` | one shared 10/hour per-user budget |
| `WS` | `/ws/status?token=<jwt>` | |

Rate limiting is two-tier: per-IP-per-minute on auth, and a much tighter
per-user-per-hour budget on `/ai`, because those calls cost real money.

---

## Layout

```
job-tracker/
├── backend/
│   ├── app/
│   │   ├── routers/       auth · application · dashboard · ai
│   │   ├── services/      business logic, cache, rate limits, events
│   │   ├── websockets/    connection manager + Redis broker
│   │   └── workers/       RabbitMQ consumer (separate process)
│   └── migrations/        alembic
└── frontend/
    └── src/
        ├── components/    Shell, ui primitives, status band
        ├── hooks/         auth, applications cache, WebSocket, tick counter
        ├── pages/         9 routes
        └── services/      typed API client
```

---

## Known limitations

Stated plainly, because they're deliberate tradeoffs or honest gaps:

- **A page refresh signs you out.** The JWT is held in memory, never
  `localStorage` — a smaller XSS surface, at the cost of persistence. Fixing it
  properly means a refresh-token endpoint, which doesn't exist yet.
- **Applications can't be edited after creation.** Only status changes; there's
  no `PUT /applications/{id}`. The UI says so rather than hiding it.
- **No profile or password endpoints**, so the account page is read-only.
- **The list is capped at 50 rows** server-side with no pagination parameter,
  so filtering happens over the first 50.
- **The WebSocket token rides in the query string**, because the browser's
  `WebSocket` constructor can't set headers. Mitigated by the 60-minute expiry;
  the real fix is a single-use ticket endpoint.
- **Not deployed yet.** No live link — see the roadmap.

---

## Roadmap — Inbox-driven status detection

Right now a job's status changes because *you* clicked something. That works, but
it means the tracker only ever knows what you remember to tell it — and the
notification email is redundant, since you already knew.

The next step closes that loop: **let the tracker read the rejections and
interview invites as they land in your inbox, and update itself.**

```
        Gmail                                                    You
          │                                                       ▲
          │ (1) new mail                                          │
          ▼                                                       │
┌──────────────────────┐   (3) status_changed    ┌────────────────┴───────┐
│   email_poller       │  ───────────────────►   │  notification worker   │
│   • fetch new mail   │      status_events      │  "Globex → interview,  │
│   • match to an app  │        (existing)       │   confirm?"            │
│   • classify intent  │                         └────────────────────────┘
└──────────┬───────────┘
           │ (2) write a suggestion, don't overwrite
           ▼
      Postgres: status_suggestions
```

### How it works

| Step | Approach |
|------|----------|
| Read the inbox | Gmail API, OAuth2 `gmail.readonly`, polled with `q=newer_than:1d` (upgradeable to `users.watch()` + Pub/Sub push) |
| Find the application | sender domain vs. `company_domain`, plus fuzzy match on company/role in the subject — restricted to applications not already in a terminal state |
| Decide what happened | keyword rules first ("we regret" → rejected, "your availability" → interview, "pleased to offer" → offer); an LLM pass for the phrasing the rules miss |
| Apply it | **never auto-overwrite** — write a suggestion with a confidence score and the source email, and let the user confirm in one click |
| Tell the user | publish to the existing `status_events` queue; the notification worker is unchanged |

### Why it's built this way

- **Suggest, don't decide.** Classifying email is probabilistic. A wrong auto-update silently corrupts your own job history — the one thing a tracker must never do. A suggestion is cheap to dismiss.
- **The notification finally earns its place.** "You changed this" is noise. "Globex emailed you, this looks like an interview" is the product.
- **Nothing downstream changes.** The poller is just another producer on `status_events`. That is the whole reason the publish/consume split exists — see [`rabbitmq_summary.md`](rabbitmq_summary.md).

### Known constraint

`gmail.readonly` is a Google **restricted scope**. Publishing to unlimited users
requires app verification and a third-party security assessment. In Testing mode
the app supports up to 100 authorized users with no review, which is sufficient
for personal use and demos.
