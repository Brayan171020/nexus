import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';
import { TaskJobData } from '../tasks/services/tasks.service';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    postgres: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectQueue('tasks') private readonly tasksQueue: Queue<TaskJobData>,
  ) {}

  async check(): Promise<HealthResponse> {
    const services: HealthResponse['services'] = { postgres: 'down', redis: 'down' };
    try {
      await this.dataSource.query('SELECT 1');
      services.postgres = 'up';
      const redisClient = await this.tasksQueue.client;
      await redisClient.get('__nexus_healthcheck__');
      services.redis = 'up';
    } catch (error: unknown) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        services,
        reason: error instanceof Error ? error.message : 'Infrastructure unavailable',
      });
    }
    return { status: 'ok', timestamp: new Date().toISOString(), services };
  }
}
