from datetime import date

from fastapi import HTTPException, status
from google import genai
from google.genai import types as genai_types

from app.config import settings
from app.models.application import JobApplication

# Built lazily rather than at import time: constructing it with no key
# should fail as a clean 503 the UI can display, not an opaque 500 the
# first time someone hits /ai.
_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "GEMINI_API_KEY is not configured, so the AI features are "
                "unavailable. Set it in the environment and restart the API."
            ),
        )
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def _generate(prompt: str, max_output_tokens: int) -> str:
    response = get_client().models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            max_output_tokens=max_output_tokens,
            # These are plain single-turn generations, not problems that need
            # chain-of-thought — without this, "thinking" tokens (invisible
            # reasoning that comes out of the same max_output_tokens budget)
            # can eat most of the budget and truncate the actual answer.
            thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return response.text


NO_DATA_MESSAGE = (
    "You don't have any applications logged yet — add a few so there's "
    "something to analyze."
)


def _summarize_applications(applications: list[JobApplication]) -> str:
    # Send the model a compact, structured summary instead of raw ORM objects —
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

    return _generate(_build_prompt(applications), max_output_tokens=1000)


def _build_cover_letter_prompt(company_name: str, role: str, skills: str) -> str:
    return (
        f"Write a tailored, concise cold email / cover letter for a {role} "
        f"position at {company_name}. Highlight these skills naturally, don't "
        f"just list them: {skills}. Keep it under 200 words, professional but "
        "not stiff, and ready to send as-is — no placeholder brackets."
    )


def generate_cover_letter(company_name: str, role: str, skills: str) -> str:
    prompt = _build_cover_letter_prompt(company_name, role, skills)
    return _generate(prompt, max_output_tokens=600)


def _build_interview_prep_prompt(
    company_name: str,
    role: str,
    status: str | None = None,
    notes: str | None = None,
) -> str:
    # status/notes are only present when the request pointed at a saved
    # application — they let the model aim the prep at the round that's
    # actually coming up instead of giving generic advice.
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
    prompt = _build_interview_prep_prompt(company_name, role, status, notes)
    return _generate(prompt, max_output_tokens=1500)
