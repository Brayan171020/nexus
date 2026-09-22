import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bullmq';
import { In, Repository } from 'typeorm';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskResponseDto } from '../dto/task-response.dto';
import { AiAnalysis, TaskEntity, TaskErrorDetails, TaskPriority, TaskStatus } from '../entities/task.entity';
import { JobMetadata } from '../dto/task-response.dto';

export interface TaskMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  dlq: number;
  totalHistorical: number;
}

export interface TaskJobData {
  taskId: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private readonly tasksRepository: Repository<TaskEntity>,
    @InjectQueue('tasks') private readonly tasksQueue: Queue<TaskJobData>,
    @InjectQueue('tasks-dlq') private readonly dlqQueue: Queue<TaskJobData>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = this.tasksRepository.create({ ...createTaskDto, status: TaskStatus.PENDING, retryCount: 0 });
    const savedTask = await this.tasksRepository.save(task);
    await this.tasksQueue.add('triage-task', { taskId: savedTask.id }, {
      jobId: savedTask.id,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000, jitter: 0.5 },
      removeOnComplete: false,
      removeOnFail: false,
    });
    return {
      taskId: savedTask.id,
      status: savedTask.status,
      message: 'Task queued for processing',
      retryCount: savedTask.retryCount,
      createdAt: savedTask.createdAt,
      updatedAt: savedTask.updatedAt,
    };
  }

  async getById(id: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    const job = await this.tasksQueue.getJob(task.id);
    return TaskResponseDto.fromEntity(task, job ? await this.toJobMetadata(job) : null);
  }

  async getMetrics(): Promise<TaskMetrics> {
    const [queueCounts, dlqCounts, totalHistorical] = await Promise.all([
      this.tasksQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      this.dlqQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      this.tasksRepository.count(),
    ]);
    return {
      waiting: queueCounts.waiting ?? 0,
      active: queueCounts.active ?? 0,
      completed: queueCounts.completed ?? 0,
      failed: queueCounts.failed ?? 0,
      delayed: queueCounts.delayed ?? 0,
      dlq: (dlqCounts.waiting ?? 0) + (dlqCounts.active ?? 0) + (dlqCounts.failed ?? 0) + (dlqCounts.delayed ?? 0),
      totalHistorical,
    };
  }

  async markProcessing(id: string, attempt: number): Promise<void> {
    await this.tasksRepository.update(
      { id, status: In([TaskStatus.PENDING, TaskStatus.PROCESSING]) },
      { status: TaskStatus.PROCESSING, retryCount: attempt, errorDetails: null },
    );
  }

  async markCompleted(id: string, result: { priority: TaskPriority; category: string; analysis: AiAnalysis }): Promise<void> {
    await this.tasksRepository.update(
      { id, status: TaskStatus.PROCESSING },
      { status: TaskStatus.COMPLETED, priority: result.priority, category: result.category, aiAnalysis: result.analysis, processedAt: new Date() },
    );
  }

  async recordRetry(id: string): Promise<void> {
    await this.tasksRepository.increment({ id, status: TaskStatus.PROCESSING }, 'retryCount', 1);
  }

  async markFailed(id: string, details: TaskErrorDetails): Promise<void> {
    await this.tasksRepository.update(
      { id, status: In([TaskStatus.PROCESSING, TaskStatus.FAILED]) },
      { status: TaskStatus.FAILED, errorDetails: details, failedAt: new Date() },
    );
  }

  private async toJobMetadata(job: Job<TaskJobData>): Promise<JobMetadata> {
    return {
      id: job.id ?? '',
      state: await job.getState(),
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts ?? 1,
      failedReason: job.failedReason,
    };
  }
}
