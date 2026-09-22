import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskResponseDto } from '../dto/task-response.dto';
import { TaskEntity, TaskStatus } from '../entities/task.entity';

export interface TaskJobData {
  taskId: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private readonly tasksRepository: Repository<TaskEntity>,
    @InjectQueue('tasks') private readonly tasksQueue: Queue<TaskJobData>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = this.tasksRepository.create({ ...createTaskDto, status: TaskStatus.PENDING, retryCount: 0 });
    const savedTask = await this.tasksRepository.save(task);
    await this.tasksQueue.add('triage-task', { taskId: savedTask.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    return { taskId: savedTask.id, status: savedTask.status, message: 'Task queued for processing' };
  }

  async getById(id: string): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }
}
