import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AiTriageService } from '../../ai-triage/services/ai-triage.service';
import { TaskEntity, TaskErrorDetails, TaskPriority, TaskStatus } from '../../tasks/entities/task.entity';
import { TaskJobData } from '../../tasks/services/tasks.service';

@Injectable()
@Processor('tasks')
export class TaskProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    @InjectRepository(TaskEntity) private readonly tasksRepository: Repository<TaskEntity>,
    private readonly aiTriageService: AiTriageService,
    @InjectQueue('tasks-dlq') private readonly dlqQueue: Queue<TaskJobData>,
  ) { super(); }

  async process(job: Job<TaskJobData>): Promise<void> {
    const task = await this.tasksRepository.findOneBy({ id: job.data.taskId });
    if (!task) {
      this.logger.warn(`Task ${job.data.taskId} no longer exists`);
      return;
    }
    await this.tasksRepository.update(
      { id: task.id, status: In([TaskStatus.PENDING, TaskStatus.PROCESSING]) },
      { status: TaskStatus.PROCESSING, retryCount: job.attemptsMade, errorDetails: null },
    );
    try {
      const result = await this.aiTriageService.analyze(task.title, task.rawPayload);
      const priority = { LOW: TaskPriority.LOW, MEDIUM: TaskPriority.MEDIUM, HIGH: TaskPriority.HIGH, URGENT: TaskPriority.URGENT }[result.priority];
      await this.tasksRepository.update(
        { id: task.id, status: TaskStatus.PROCESSING },
        { status: TaskStatus.COMPLETED, priority, category: result.category, aiAnalysis: result, processedAt: new Date() },
      );
    } catch (error: unknown) {
      const exhausted = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      const errorDetails: TaskErrorDetails = {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown processing error',
        stack: error instanceof Error ? error.stack : undefined,
        attempt: job.attemptsMade + 1,
        failedAt: new Date().toISOString(),
      };
      if (exhausted) {
        await this.tasksRepository.update(
          { id: task.id, status: In([TaskStatus.PROCESSING, TaskStatus.FAILED]) },
          { status: TaskStatus.FAILED, errorDetails, failedAt: new Date(), retryCount: job.attemptsMade + 1 },
        );
        await this.dlqQueue.add('failed-task', { taskId: task.id }, { jobId: `dlq-${task.id}`, removeOnComplete: false, removeOnFail: false });
      } else {
        await this.tasksRepository.increment({ id: task.id, status: TaskStatus.PROCESSING }, 'retryCount', 1);
      }
      throw error;
    }
  }
}
