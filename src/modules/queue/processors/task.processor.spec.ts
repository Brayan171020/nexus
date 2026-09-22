import { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { AiTriageService } from '../../ai-triage/services/ai-triage.service';
import { TaskEntity, TaskPriority, TaskStatus } from '../../tasks/entities/task.entity';
import { TaskJobData } from '../../tasks/services/tasks.service';
import { TaskProcessor } from './task.processor';

describe('TaskProcessor', () => {
  const task: TaskEntity = {
    id: 'task-1', title: 'Payment failure', rawPayload: 'urgent error', status: TaskStatus.PENDING,
    priority: null, category: null, aiAnalysis: null, retryCount: 0, errorDetails: null,
    processedAt: null, failedAt: null, createdAt: new Date(), updatedAt: new Date(),
  };
  const repository = {
    findOneBy: jest.fn().mockResolvedValue(task),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    increment: jest.fn().mockResolvedValue({ affected: 1 }),
  } as unknown as jest.Mocked<Repository<TaskEntity>>;
  const triage = {
    analyze: jest.fn().mockResolvedValue({ priority: TaskPriority.HIGH, category: 'technical', summary: 'Failure', sentiment: 'NEGATIVE', recommendedAction: 'Review', slaHours: 4 }),
  } as unknown as jest.Mocked<AiTriageService>;
  const dlq = { add: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<Queue<TaskJobData>>;
  let processor: TaskProcessor;

  const job = (attemptsMade: number, attempts = 3): Job<TaskJobData> => ({
    data: { taskId: 'task-1' },
    attemptsMade,
    opts: { attempts },
  } as unknown as Job<TaskJobData>);

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new TaskProcessor(repository, triage, dlq);
  });

  it('transitions a task to completed after successful triage', async () => {
    await processor.process(job(0));

    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }), expect.objectContaining({ status: TaskStatus.COMPLETED }));
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }), expect.objectContaining({ aiAnalysis: expect.objectContaining({ summary: 'Failure', slaHours: 4 }) }));
    expect(dlq.add).not.toHaveBeenCalled();
  });

  it('increments retry count for a transient processing failure', async () => {
    triage.analyze.mockRejectedValue(new Error('temporary provider outage'));

    await expect(processor.process(job(0))).rejects.toThrow('temporary provider outage');
    expect(repository.increment).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1', status: TaskStatus.PROCESSING }), 'retryCount', 1);
    expect(dlq.add).not.toHaveBeenCalled();
  });

  it('marks exhausted jobs failed and sends them to the DLQ', async () => {
    triage.analyze.mockRejectedValue(new Error('permanent failure'));

    await expect(processor.process(job(2))).rejects.toThrow('permanent failure');
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }), expect.objectContaining({ status: TaskStatus.FAILED, retryCount: 3 }));
    expect(dlq.add).toHaveBeenCalledWith('failed-task', { taskId: 'task-1' }, expect.objectContaining({ jobId: 'dlq-task-1' }));
  });
});
