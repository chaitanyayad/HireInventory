from datetime import date

import anthropic
from fastapi import HTTPException, status

from app.config import settings
from app.models.application import JobApplication

# Built lazily rather than at import time. Constructing the client with no key
# raises a TypeError deep inside the SDK, which surfaced as a bodyless HTTP 500
# with no hint that the cause was configuration. Now a missing key is caught
# before any request is attempted and reported as a 503 the UI can display.
_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "ANTHROPIC_API_KEY is not configured, so the AI features are "
                "unavailable. Set it in the environment and restart the API."
            ),
        )
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client

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

    response = get_client().messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1000,
        messages=[{"role": "user", "content": _build_prompt(applications)}],
    )
    return response.content[0].text


def _build_cover_letter_prompt(company_name: str, role: str, skills: str) -> str:
    return (
        f"Write a tailored, concise cold email / cover letter for a {role} "
        f"position at {company_name}. Highlight these skills naturally, don't "
        f"just list them: {skills}. Keep it under 200 words, professional but "
        "not stiff, and ready to send as-is — no placeholder brackets."
    )


def generate_cover_letter(company_name: str, role: str, skills: str) -> str:
    response = get_client().messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=600,
        messages=[
            {"role": "user", "content": _build_cover_letter_prompt(company_name, role, skills)}
        ],
    )
    return response.content[0].text


def _build_interview_prep_prompt(
    company_name: str,
    role: str,
    status: str | None = None,
    notes: str | None = None,
) -> str:
    # status/notes are only present when the request pointed at a saved
    # application — they let Claude aim the prep at the round that's actually
    # coming up instead of giving generic advice.
    context = ""
    if status:
        context += f"\nI'm currently at the '{status}' stage of this application."
    if notes:
        context += f"\nMy notes on this application: {notes}"

    return (
        f"I have an interview coming up for a {role} position at {company_name}."
        f"{context}\n\n"
        "Tell me how to prepare. Cover:\n"
        "1. The technical topics most likely to come up for this role\n"
        "2. Likely behavioural / HR questions, given this company\n"
        "3. 5-8 concrete practice questions I should be able to answer\n"
        "4. What I should ask them\n"
        "Be specific to this role and company — no generic interview advice."
    )


def generate_interview_prep(
    company_name: str,
    role: str,
    status: str | None = None,
    notes: str | None = None,
) -> str:
    response = get_client().messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": _build_interview_prep_prompt(company_name, role, status, notes),
            }
        ],
    )
    return response.content[0].text
