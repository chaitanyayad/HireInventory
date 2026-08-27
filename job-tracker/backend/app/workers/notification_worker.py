"""
T14 — Notification worker (the CONSUMER side of RabbitMQ).

This is NOT part of the FastAPI app. It's a separate OS process that runs
alongside the API. Run it from backend/ in its own terminal:

    python -m app.workers.notification_worker

Flow:
    API publishes event ──> RabbitMQ queue ──> this worker ──> email

Key consumer concepts (interview material):
- prefetch_count=1 : "don't give me a new message until I've acked the
  current one." Without this RabbitMQ would dump many messages on us at once.
- manual ack       : we only tell RabbitMQ "done, delete it" AFTER the email
  is sent. If this process crashes mid-email, the un-acked message goes back
  on the queue and gets redelivered — no notification is silently lost.
- if EMAILS_ENABLED is False (default in dev) we just print the email to the
  console, so the whole pipeline is testable without SMTP credentials.
"""

import json
import logging
import smtplib
import time
from email.message import EmailMessage

import pika

from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("notification_worker")


def build_email(event: dict) -> EmailMessage:
    """Turn a status_changed event into an email message."""
    msg = EmailMessage()
    msg["Subject"] = (
        f"Update: {event['company_name']} — status is now {event['new_status'].title()}"
    )
    msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
    msg["To"] = event["user_email"]
    msg.set_content(
        f"Hi,\n\n"
        f"Your application for {event['role']} at {event['company_name']} "
        f"just moved from {event['old_status']} to {event['new_status']}.\n\n"
        f"Keep going — every status change is progress.\n\n"
        f"— HireInventory"
    )
    return msg


def send_email(msg: EmailMessage) -> None:
    if not settings.EMAILS_ENABLED:
        # Dev mode: print instead of send. Lets you demo the full
        # producer -> queue -> consumer pipeline with zero SMTP setup.
        logger.info("EMAILS_ENABLED=False — printing email instead of sending:")
        print("-" * 60)
        print(f"To:      {msg['To']}")
        print(f"Subject: {msg['Subject']}")
        print(msg.get_content())
        print("-" * 60)
        return

    # STARTTLS: connect plaintext on 587, then upgrade to encrypted.
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
    logger.info("Email sent to %s", msg["To"])


def handle_message(channel, method, properties, body) -> None:
    """Called by pika once per message pulled off the queue."""
    try:
        event = json.loads(body)
        logger.info(
            "Received %s for application %s",
            event.get("event_type"), event.get("application_id"),
        )
        send_email(build_email(event))
        # Ack ONLY after success — this is what deletes the message.
        channel.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError:
        # Malformed message will never succeed — drop it (requeue=False),
        # otherwise it would loop back to us forever (a "poison message").
        logger.error("Dropping malformed message: %r", body)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception:
        # Transient failure (e.g. SMTP hiccup) — put it back on the queue
        # so it can be retried.
        logger.exception("Failed to process message, requeueing")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        time.sleep(5)  # don't hot-loop if SMTP stays down


def main() -> None:
    # Retry loop so the worker survives RabbitMQ restarts / starting first.
    while True:
        try:
            connection = pika.BlockingConnection(
                pika.URLParameters(settings.RABBITMQ_URL)
            )
            channel = connection.channel()
            # Same durable declare as the producer — whoever starts first creates it.
            channel.queue_declare(queue=settings.STATUS_EVENTS_QUEUE, durable=True)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=settings.STATUS_EVENTS_QUEUE,
                on_message_callback=handle_message,
            )
            logger.info(
                "Worker started. Waiting for messages on '%s' (CTRL+C to exit)",
                settings.STATUS_EVENTS_QUEUE,
            )
            channel.start_consuming()  # blocks forever, calls handle_message
        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break
        except pika.exceptions.AMQPConnectionError:
            logger.warning("RabbitMQ unreachable, retrying in 5s...")
            time.sleep(5)


if __name__ == "__main__":
    main()
