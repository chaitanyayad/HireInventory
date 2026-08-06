from datetime import date

import anthropic

from app.config import settings
from app.models.application import JobApplication

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

NO_DATA_MESSAGE = (
    "You don't have any applications logged yet — add a few so there's "
    "something to analyze."
)


def _summarize_applications(applications: list[JobApplication]) -> str:
    # Send Claude a compact, structured summary instead of raw ORM objects —
    # cheaper on tokens and keeps the prompt free of things it doesn't need
    # (ids, timestamps we don't care about).
    lines = []
    for app in applications:
        days_open = (date.today() - app.date_applied).days
        lines.append(
            f"- {app.company_name} | role: {app.role} | status: {app.status.value} "
            f"| applied {app.date_applied.isoformat()} ({days_open} days ago)"
            + (f" | interview: {app.interview_date.isoformat()}" if app.interview_date else "")
        )
    return "\n".join(lines)


def _build_prompt(applications: list[JobApplication]) -> str:
    summary = _summarize_applications(applications)
    return (
        "Here is my job application history:\n\n"
        f"{summary}\n\n"
        "Analyze this data and give me plain-English insights: response rate, "
        "which kinds of roles/companies respond better, where I'm losing "
        "momentum in the funnel, and any applications that look stale and "
        "need a follow-up. Keep it concise and actionable."
    )


def analyze_applications(applications: list[JobApplication]) -> str:
    if not applications:
        return NO_DATA_MESSAGE

    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1000,
        messages=[{"role": "user", "content": _build_prompt(applications)}],
    )
    return response.content[0].text
