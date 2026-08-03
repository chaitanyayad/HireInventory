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

![Under Construction](https://readme-typing-svg.demolab.com?font=Fira+Code&size=28&pause=1000&color=F7B731&center=true&vCenter=true&width=600&lines=🚧+Under+Construction+🚧;Coming+Soon...;Something+awesome+is+brewing+☕;Stay+tuned!+🔥)

<br/>

---

### 🛠️ This project is actively being built

<br/>

>"Check back soon."

<br/>

![Progress](https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge&logo=github)
![Made with](https://img.shields.io/badge/Made%20with-passion-red?style=for-the-badge&logo=heart)

<br/>

```
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠉⠉⠻⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠁  ⚙️  ⠈⢿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠁  building...  ⠹⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇  🔨 🔧 🔩      ⢸⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀             ⣸⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣄⣀⣠⣴⣾⣿⣿⣿⣿
```

<br/>

---

<sub>Built by <a href="https://github.com/chaitanyayadav">Chaitanya Yadav</a> · Coming soon to a browser near you 🚀</sub>

<br/>

</div>

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

