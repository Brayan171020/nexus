# NexusTask-AI — Plan de Implementación

Este documento define el roadmap de ingeniería para evolucionar NexusTask-AI desde el scaffold inicial hacia un motor de procesamiento asíncrono, triage con IA, seguridad y operación observable.

## Fase 1: Motor Asíncrono y Resiliencia de Tareas

### Objetivo de negocio e ingeniería

Garantizar que la recepción de tareas sea rápida, desacoplada y resistente a fallos transitorios, manteniendo una fuente de verdad consistente en PostgreSQL y un ciclo de vida observable (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).

### Entregables técnicos y componentes

- Consolidar el pipeline `POST /api/v1/tasks` → persistencia en PostgreSQL → job BullMQ.
- Completar las transiciones de estado y la actualización atómica de `retryCount`.
- Configurar reintentos exponenciales con jitter, backoff configurable y límites por tipo de error.
- Implementar una Dead Letter Queue (DLQ) para jobs agotados, con motivo de fallo y trazabilidad del job original.
- Añadir `GET /api/v1/tasks/:id` para consultar estado, resultado y metadatos de procesamiento.
- Añadir `GET /api/v1/tasks/metrics` para métricas de backlog, throughput, latencia, errores y jobs en DLQ.
- Incorporar health checks de PostgreSQL y Redis, además de métricas exportables para observabilidad.

### Criterios de aceptación (DoD)

- Una tarea aceptada devuelve `202` y nunca bloquea la petición esperando al worker.
- Cada job sigue transiciones válidas y no puede quedar silenciosamente perdido.
- Un fallo transitorio se reintenta con backoff exponencial y jitter; un fallo permanente termina en la DLQ.
- El endpoint de consulta refleja de forma consistente el estado persistido y los metadatos del job.
- Las métricas se validan con pruebas automatizadas y no exponen payloads sensibles.
- Redis y PostgreSQL pueden reiniciarse sin corrupción de estados ni duplicación no controlada.

## Fase 2: Motor de Triage y Extracción Estructurada con IA

### Objetivo de negocio e ingeniería

Convertir texto no estructurado en decisiones operativas consistentes: categoría técnica, prioridad basada en SLA, sentimiento, resumen ejecutivo y plan de acción.

### Entregables técnicos y componentes

- Implementar un adapter desacoplado para un SDK de LLM (Gemini, Claude u OpenAI), seleccionable por configuración.
- Usar Structured Outputs y validar la respuesta con un schema estricto de Zod o `class-validator`.
- Definir el contrato versionado de `AiAnalysis`, incluyendo categoría, prioridad, sentimiento, resumen y acción recomendada.
- Implementar fallback determinista o proveedor secundario cuando la respuesta sea inválida o el proveedor no esté disponible.
- Añadir rate limiting, timeouts, circuit breaker y cancelación de requests externas.
- Redactar secretos y datos sensibles antes de enviarlos al proveedor; controlar límites de tokens y costes.
- Mantener un adapter `mock` para desarrollo local y pruebas reproducibles.

### Criterios de aceptación (DoD)

- Ninguna respuesta del LLM llega a PostgreSQL sin pasar validación estricta.
- Las respuestas inválidas, incompletas o fuera de timeout siguen la política de fallback y quedan trazadas.
- La configuración de proveedor, modelo, timeout y límites se valida al arrancar la aplicación.
- Se prueban casos positivos, respuestas malformadas, rate limits, timeouts y errores del proveedor.
- El contrato de salida queda documentado en Swagger y es compatible con consumidores versionados.

## Fase 3: Capa de Seguridad, Eventos en Tiempo Real y Auditoría

### Objetivo de negocio e ingeniería

Proteger el acceso al motor, ofrecer feedback inmediato a clientes y conservar una historia verificable de las decisiones y cambios de estado.

### Entregables técnicos y componentes

- Implementar autenticación mediante API Keys para integraciones servidor-a-servidor o JWT Bearer para clientes con identidad.
- Añadir guards, scopes/roles, rotación y revocación de credenciales, además de rate limiting por cliente.
- Incorporar un gateway Socket.IO para emitir progreso, finalización y fallos de tareas.
- Diseñar eventos versionados e idempotentes, con autorización por tenant o propietario de la tarea.
- Crear logs estructurados con correlation ID, task ID, job ID, actor, duración y resultado.
- Persistir un historial append-only de cambios de estado y eventos de auditoría.
- Aplicar redacción de PII y políticas de retención a logs y auditoría.

### Criterios de aceptación (DoD)

- Endpoints REST, WebSocket y operaciones internas requieren autorización según su superficie.
- Una actualización de tarea produce un evento con contrato documentado y correlation ID.
- El historial permite reconstruir quién, cuándo y por qué cambió cada estado.
- No se almacenan secretos ni payloads sensibles sin redacción explícita.
- Se cubren expiración, revocación, conexión perdida, reconexión y replay seguro de eventos.

## Fase 4: Suite de Pruebas Automatizadas y CI/CD

### Objetivo de negocio e ingeniería

Crear una barrera de calidad repetible que permita evolucionar el sistema con confianza y entregar cambios pequeños, verificables y auditables.

### Entregables técnicos y componentes

- Añadir pruebas unitarias con Jest para `TasksService`, estados, reintentos y `AiTriageService`.
- Añadir pruebas de integración E2E con Supertest para `POST /api/v1/tasks`, validación, persistencia y encolamiento BullMQ.
- Incorporar infraestructura efímera o servicios Docker para PostgreSQL y Redis durante la suite de integración.
- Añadir pruebas de contratos para Swagger, payloads de IA y eventos Socket.IO.
- Configurar GitHub Actions para linting, typecheck, tests unitarios, E2E y build en cada pull request y push a `main`.
- Añadir cobertura mínima, caching seguro de pnpm y protección de rama con checks obligatorios.
- Preparar pipeline de despliegue con migraciones controladas y rollback documentado.

### Criterios de aceptación (DoD)

- Los checks de CI son reproducibles en un runner limpio y fallan ante errores de tipos, lint o tests.
- El flujo E2E valida la cadena completa desde la API hasta el job persistido.
- Los tests no dependen de servicios externos de IA ni de credenciales reales.
- La cobertura y sus umbrales están publicados como artefactos de CI.
- `main` solo acepta cambios con checks verdes y revisión requerida.
