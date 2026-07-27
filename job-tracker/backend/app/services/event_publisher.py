"""
T13 — Event publisher (the PRODUCER side of RabbitMQ).

Producers vs consumers
----------------------
- Producer  = code that PUBLISHES a message onto a queue (this file).
- Consumer  = a separate process that READS messages off the queue
              (app/workers/notification_worker.py).

Why bother? When a user updates an application's status, we want to send
them an email. Sending email over SMTP can take 1-3 seconds. If we did it
inside the API request, every PATCH /applications/{id}/status would hang
for 3 seconds. Instead the API just drops a tiny JSON message on a queue
(takes ~1ms) and returns instantly. The worker picks it up whenever and
sends the email. That's "decoupling" — the interview talking point.

Durability
----------
- durable=True on the queue      → the queue itself survives a broker restart.
- delivery_mode=Persistent on msg → the message is written to disk, so it
                                     survives a broker restart too.
Both are needed: a persistent message in a non-durable queue still dies.
"""

import json
import logging
from datetime import datetime, timezone

import pika

from app.config import settings

logger = logging.getLogger(__name__)


def publish_status_change_event(
    *,
    application_id: str,
    user_id: str,
    user_email: str,
    company_name: str,
    role: str,
    old_status: str,
    new_status: str,
) -> None:
    """Publish one status-change event. Never raises.

    Fail-open on purpose: if RabbitMQ is down, the user should still be able
    to update their application — they just won't get the email. A message
    queue being down must never break the core API.
    """
    event = {
        "event_type": "status_changed",
        "application_id": application_id,
        "user_id": user_id,
        "user_email": user_email,
        "company_name": company_name,
        "role": role,
        "old_status": old_status,
        "new_status": new_status,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        # BlockingConnection = simple synchronous client, fine for a web app
        # publishing one small message per request.
        connection = pika.BlockingConnection(pika.URLParameters(settings.RABBITMQ_URL))
        try:
            channel = connection.channel()

            # Idempotent: creates the queue if missing, no-op if it exists.
            # Both producer and consumer declare it so startup order doesn't matter.
            channel.queue_declare(queue=settings.STATUS_EVENTS_QUEUE, durable=True)

            channel.basic_publish(
                exchange="",  # default exchange routes by queue name
                routing_key=settings.STATUS_EVENTS_QUEUE,
                body=json.dumps(event),
                properties=pika.BasicProperties(
                    delivery_mode=pika.DeliveryMode.Persistent,
                    content_type="application/json",
                ),
            )
            logger.info(
                "Published status_changed event for application %s (%s -> %s)",
                application_id, old_status, new_status,
            )
        finally:
            connection.close()
    except Exception:
        logger.warning(
            "Could not publish status event for application %s — is RabbitMQ running?",
            application_id, exc_info=True,
        )
