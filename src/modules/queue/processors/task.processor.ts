import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiTriageService } from '../../ai-triage/services/ai-triage.service';
import { TaskEntity, TaskStatus } from '../../tasks/entities/task.entity';
import { TaskJobData } from '../../tasks/services/tasks.service';

@Injectable()
@Processor('tasks')
export class TaskProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    @InjectRepository(TaskEntity) private readonly tasksRepository: Repository<TaskEntity>,
    private readonly aiTriageService: AiTriageService,
  ) { super(); }

  async process(job: Job<TaskJobData>): Promise<void> {
    const task = await this.tasksRepository.findOneBy({ id: job.data.taskId });
    if (!task) {
      this.logger.warn(`Task ${job.data.taskId} no longer exists`);
      return;
    }
    task.status = TaskStatus.PROCESSING;
    task.retryCount = job.attemptsMade;
    await this.tasksRepository.save(task);
    try {
      const result = this.aiTriageService.analyze(task.title, task.rawPayload);
      task.priority = result.priority;
      task.category = result.category;
      task.aiAnalysis = result.analysis;
      task.status = TaskStatus.COMPLETED;
      await this.tasksRepository.save(task);
    } catch (error: unknown) {
      task.status = TaskStatus.FAILED;
      task.retryCount = job.attemptsMade + 1;
      await this.tasksRepository.save(task);
      throw error;
    }
  }
}
