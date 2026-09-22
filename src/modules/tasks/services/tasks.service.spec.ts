import { NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { TaskJobData, TasksService } from './tasks.service';
import { TaskEntity, TaskStatus } from '../entities/task.entity';
import { AuditService } from '../../audit/services/audit.service';
import { TasksGateway } from '../../realtime/tasks.gateway';

describe('TasksService', () => {
  const task: TaskEntity = {
    id: 'task-1', title: 'Test task', rawPayload: 'payload', status: TaskStatus.PENDING,
    priority: null, category: null, aiAnalysis: null, retryCount: 0, errorDetails: null,
    processedAt: null, failedAt: null, createdAt: new Date(), updatedAt: new Date(),
  };
  const repository = {
    create: jest.fn().mockReturnValue(task),
    save: jest.fn().mockResolvedValue(task),
    findOneBy: jest.fn(),
    count: jest.fn().mockResolvedValue(1),
    update: jest.fn(),
    increment: jest.fn(),
  } as unknown as jest.Mocked<Repository<TaskEntity>>;
  const queue = {
    add: jest.fn().mockResolvedValue({}),
    getJob: jest.fn().mockResolvedValue(undefined),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 1, active: 0, completed: 2, failed: 0, delayed: 0 }),
  } as unknown as jest.Mocked<Queue<TaskJobData>>;
  const dlq = {
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 1, delayed: 0 }),
  } as unknown as jest.Mocked<Queue<TaskJobData>>;
  const audit = { record: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<AuditService>;
  const gateway = { emitStatusUpdated: jest.fn() } as unknown as jest.Mocked<TasksGateway>;
  let service: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(repository, queue, dlq, audit, gateway);
  });

  it('persists a pending task and dispatches a resilient job', async () => {
    const response = await service.create({ title: 'Test task', rawPayload: 'payload' });

    expect(response).toMatchObject({ taskId: 'task-1', status: TaskStatus.PENDING, message: 'Task queued for processing' });
    expect(queue.add).toHaveBeenCalledWith('triage-task', expect.objectContaining({ taskId: 'task-1', correlationId: 'unknown' }), expect.objectContaining({ attempts: 3, removeOnComplete: false, removeOnFail: false }));
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'TASK_CREATED', correlationId: 'unknown' }));
  });

  it('returns a standardized not-found exception for an unknown task', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('aggregates queue and database operational metrics', async () => {
    await expect(service.getMetrics()).resolves.toEqual({ waiting: 1, active: 0, completed: 2, failed: 0, delayed: 0, dlq: 1, totalHistorical: 1 });
  });
});
