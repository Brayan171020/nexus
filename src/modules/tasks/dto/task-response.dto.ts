import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiAnalysis, TaskEntity, TaskPriority, TaskStatus, TaskErrorDetails } from '../entities/task.entity';

export class TaskResponseDto {
  @ApiProperty()
  taskId!: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  status!: TaskStatus;

  @ApiProperty({ example: 'Task queued for processing' })
  message!: string;

  @ApiPropertyOptional({ enum: TaskPriority, nullable: true })
  priority?: TaskPriority | null;

  @ApiPropertyOptional({ nullable: true })
  category?: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  aiAnalysis?: AiAnalysis | null;

  @ApiProperty()
  retryCount!: number;

  @ApiPropertyOptional({ type: Object, nullable: true })
  errorDetails?: TaskErrorDetails | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  processedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  failedAt?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: Object, nullable: true })
  job?: JobMetadata | null;

  static fromEntity(entity: TaskEntity, job: JobMetadata | null = null): TaskResponseDto {
    return {
      taskId: entity.id,
      status: entity.status,
      message: 'Task status retrieved',
      priority: entity.priority,
      category: entity.category,
      aiAnalysis: entity.aiAnalysis,
      retryCount: entity.retryCount,
      errorDetails: entity.errorDetails,
      processedAt: entity.processedAt,
      failedAt: entity.failedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      job,
    };
  }
}

export interface JobMetadata {
  id: string;
  state: string;
  attemptsMade: number;
  maxAttempts: number;
  failedReason?: string;
}
