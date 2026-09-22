import { INestApplication, NotFoundException, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request = require('supertest');
import type { Test as SupertestTest } from 'supertest';
import { TasksController } from '../src/modules/tasks/controllers/v1/tasks.controller';
import { TasksService } from '../src/modules/tasks/services/tasks.service';
import { TaskStatus } from '../src/modules/tasks/entities/task.entity';
import { TaskResponseDto } from '../src/modules/tasks/dto/task-response.dto';
import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/health/health.service';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Tasks API (e2e)', () => {
  let app: INestApplication;
  const apiKey = 'e'.repeat(32);
  const taskResponse: TaskResponseDto = {
    taskId: 'task-e2e-1', status: TaskStatus.PENDING, message: 'Task queued for processing', retryCount: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const tasksService = {
    create: jest.fn().mockResolvedValue(taskResponse),
    getById: jest.fn().mockResolvedValue(taskResponse),
    getMetrics: jest.fn().mockResolvedValue({ waiting: 1, active: 0, completed: 2, failed: 0, delayed: 0, dlq: 0, totalHistorical: 3 }),
    getAudit: jest.fn().mockResolvedValue([]),
  };
  const healthService = {
    check: jest.fn().mockResolvedValue({ status: 'ok', timestamp: new Date().toISOString(), services: { postgres: 'up', redis: 'up' } }),
  };

  beforeAll(async () => {
    const config = { get: jest.fn((key: string, fallback?: unknown) => key === 'API_AUTH_ENABLED' ? true : key === 'API_KEY_SECRET' ? apiKey : fallback) };
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController, HealthController],
      providers: [
        { provide: TasksService, useValue: tasksService },
        { provide: HealthService, useValue: healthService },
        { provide: ConfigService, useValue: config },
        { provide: APP_GUARD, useFactory: (service: ConfigService, reflector: Reflector) => new ApiKeyGuard(service, reflector), inject: [ConfigService, Reflector] },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => app.close());
  const withKey = (test: SupertestTest): SupertestTest => test.set('x-api-key', apiKey);

  it('accepts a valid task with 202 and a queue response', async () => {
    await withKey(request(app.getHttpServer()).post('/api/v1/tasks').send({ title: 'E2E task', rawPayload: 'Payload' }))
      .expect(202).expect(({ body }) => expect(body).toMatchObject({ taskId: 'task-e2e-1', status: 'PENDING', message: 'Task queued for processing' }));
  });

  it('returns a standardized 400 for malformed payloads', async () => {
    await withKey(request(app.getHttpServer()).post('/api/v1/tasks').send({ title: '' }))
      .expect(400).expect(({ body }) => expect(body).toEqual(expect.objectContaining({ statusCode: 400, path: '/api/v1/tasks' })));
  });

  it('rejects requests without a valid API key', async () => {
    await request(app.getHttpServer()).post('/api/v1/tasks').send({ title: 'Unauthorized', rawPayload: 'payload' })
      .expect(401).expect(({ body }) => expect(body).toEqual(expect.objectContaining({ statusCode: 401 })));
  });

  it('returns existing and missing task responses', async () => {
    await withKey(request(app.getHttpServer()).get('/api/v1/tasks/task-e2e-1')).expect(200).expect(({ body }) => expect(body.taskId).toBe('task-e2e-1'));
    tasksService.getById.mockRejectedValueOnce(new NotFoundException('Task missing not found'));
    await withKey(request(app.getHttpServer()).get('/api/v1/tasks/missing')).expect(404).expect(({ body }) => expect(body).toEqual(expect.objectContaining({ statusCode: 404 })));
  });

  it('returns operational metrics', async () => {
    await withKey(request(app.getHttpServer()).get('/api/v1/tasks/metrics')).expect(200).expect(({ body }) => expect(body).toMatchObject({ totalHistorical: 3, waiting: 1 }));
  });

  it('keeps health public and reports healthy infrastructure', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200).expect(({ body }) => expect(body).toEqual(expect.objectContaining({ status: 'ok', services: { postgres: 'up', redis: 'up' } })));
  });
});
