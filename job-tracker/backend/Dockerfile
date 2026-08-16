# syntax=docker/dockerfile:1

FROM python:3.12-slim

# Bytecode files and stdout buffering both make container logs worse:
# unbuffered output means `docker compose logs -f` shows prints as they happen
# rather than when the buffer fills.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Requirements first, as its own layer: the dependency install is the slow
# step, and it should not re-run every time application code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root. The API needs no write access to anything in the image.
RUN useradd --create-home --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Overridden by docker-compose for both the API and the worker — this default
# only matters if the image is run directly.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
