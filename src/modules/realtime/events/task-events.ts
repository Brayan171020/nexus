import { AiAnalysis } from '../../tasks/entities/task.entity';
import { TaskStatus } from '../../tasks/entities/task.entity';

export interface TaskStatusUpdatedEvent {
  taskId: string;
  status: TaskStatus;
  retryCount: number;
  timestamp: string;
}

export interface TaskCompletedEvent {
  taskId: string;
  status: TaskStatus.COMPLETED;
  aiAnalysis: AiAnalysis;
  processedAt: string;
}

export interface TaskFailedEvent {
  taskId: string;
  status: TaskStatus.FAILED;
  errorReason: string;
  failedAt: string;
}
