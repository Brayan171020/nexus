# NexusTask-AI

[![CI](https://github.com/Brayan171020/nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/Brayan171020/nexus/actions/workflows/ci.yml) [![Coverage](https://img.shields.io/badge/coverage-Jest%20enabled-informational)](https://github.com/Brayan171020/nexus/actions) [![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey.svg)](package.json) [![NestJS](https://img.shields.io/badge/NestJS-11-e0234e.svg)](https://nestjs.com/) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)

> An asynchronous task-processing and AI triage engine designed for reliable intake, structured analysis, and operational workflow automation.

## Project Overview & Architecture

NexusTask-AI accepts unstructured work through a versioned NestJS REST API, persists the request before acknowledgement, and delegates processing to a resilient BullMQ worker. The current scaffold includes a deterministic triage adapter for local development; the provider adapter boundary is ready for a production LLM integration.

```text
                                      ┌──────────────────────┐
                                      │ Client / Integration  │
                                      └──────────┬───────────┘
                                                 │ POST /api/v1/tasks
                                      ┌──────────▼───────────┐
                                      │ NestJS REST API       │
                                      │ validation + Swagger  │
                                      └──────┬─────────┬─────┘
                                             │         │ enqueue
                                  persist    │         ▼
                                      ┌──────▼───┐  ┌───────────────┐
                                      │ Neon      │  │ BullMQ / Redis │
                                      │ PostgreSQL│  │ queue          │
                                      └──────▲───┘  └───────┬───────┘
                                             │ update        │ consume
                                      ┌──────┴───────────────▼──────┐
                                      │ Task Worker                  │
                                      │ retry / backoff / triage     │
                                      └──────────────┬───────────────┘
                                                     │
                                           ┌─────────▼─────────┐
                                           │ LLM Engine         │
                                           │ structured output  │
                                           └─────────┬─────────┘
                                                     │
                                  ┌──────────────────▼──────────────────┐
                                  │ PostgreSQL update + WebSocket event │
                                  └─────────────────────────────────────┘
```

## Core Features

- Asynchronous task intake with immediate `202 Accepted` responses.
- Explicit task lifecycle: `PENDING`, `PROCESSING`, `COMPLETED`, and `FAILED`.
- BullMQ-based worker processing with configurable retry and exponential backoff foundations.
- Structured triage output for priority, category, summary, sentiment, and recommended action.
- Strict request validation and a standardized HTTP error contract.
- Modular clean architecture separating API, persistence, queues, and AI adapters.
- Neon PostgreSQL persistence, Redis local development support, and OpenAPI documentation.

## Tech Stack

| Area | Technology |
| --- | --- |
| API framework | NestJS 11 |
| Language | TypeScript with `strict: true` |
| Persistence | TypeORM + Neon PostgreSQL |
| Async processing | BullMQ + Redis |
| API documentation | Swagger / OpenAPI |
| Validation | class-validator, class-transformer, Joi |
| Testing target | Jest + Supertest |
| Local dependencies | Docker Compose |

## Getting Started & Local Development

### Prerequisites

- Node.js 20 or newer
- pnpm 10 or newer (pnpm 11 is used in the verified environment)
- Docker with Docker Compose
- A PostgreSQL-compatible database, such as Neon, for the application runtime

### Environment configuration

Copy `.env.example` to `.env` and set values for your environment. Never commit `.env` or real credentials.

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL/Neon connection string | `postgresql://user:password@host/db?sslmode=require` |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `AI_PROVIDER` | Triage provider adapter | `mock` |
| `AI_MODEL` | Provider model identifier | `triage-v1` |

### Install and run

```bash
docker compose up -d
pnpm install
pnpm start:dev
```

The API is available at `http://localhost:3000`. In development, TypeORM synchronizes the entity schema; production deployments must use reviewed migrations instead.

### Automated tests

Unit tests run entirely with mocked infrastructure:

```bash
pnpm test
```

The autonomous Supertest suite validates routing, versioning, validation, API-key authorization, task queries, metrics, and the public health endpoint without Neon or Redis credentials:

```bash
pnpm run test:e2e
```

For a local coverage report, run `pnpm test -- --coverage`.

## API Documentation

Swagger UI is available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

### Queue a task

```http
POST /api/v1/tasks
Content-Type: application/json
```

```json
{
  "title": "Customer payment escalation",
  "rawPayload": "The customer reports an urgent payment failure and needs assistance immediately."
}
```

The endpoint responds immediately with `202 Accepted`:

```json
{
  "taskId": "4c2f0a4b-9cc4-4db0-bf6e-3f07c4f6c3d6",
  "status": "PENDING",
  "message": "Task queued for processing"
}
```

After worker processing, the structured analysis stored with the task follows this shape:

```json
{
  "priority": "URGENT",
  "category": "billing",
  "aiAnalysis": {
    "summary": "Customer payment escalation: The customer reports an urgent payment failure.",
    "sentiment": "negative",
    "recommendedAction": "Escalate immediately"
  }
}
```

## Roadmap

The formal implementation roadmap, including Definition of Done criteria for resilience, LLM integration, security, real-time events, auditability, testing, and CI/CD, is available in [`docs/PLAN.md`](docs/PLAN.md).

## Author

**Brayan Gamboa**

- GitHub: [@Brayan171020](https://github.com/Brayan171020)
- Portfolio: [brayan-portafolio-topaz.vercel.app](https://brayan-portafolio-topaz.vercel.app)
