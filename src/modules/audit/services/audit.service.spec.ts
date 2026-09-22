import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { TaskAuditEntity } from '../entities/task-audit.entity';

describe('AuditService', () => {
  it('appends an immutable audit entry with correlation and status data', async () => {
    const entry = { taskId: 'task-1', previousStatus: 'PENDING', newStatus: 'PROCESSING', correlationId: 'corr-1', action: 'AI_TRIAGE_STARTED' };
    const repository = {
      create: jest.fn().mockImplementation((value: TaskAuditEntity) => value),
      save: jest.fn().mockImplementation(async (value: TaskAuditEntity) => value),
    } as unknown as jest.Mocked<Repository<TaskAuditEntity>>;
    const service = new AuditService(repository);

    await service.record(entry);

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining(entry));
    expect(repository.save).toHaveBeenCalledTimes(1);
  });
});
