import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task.entity';

export class TaskResponseDto {
  @ApiProperty()
  taskId!: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  status!: TaskStatus;

  @ApiProperty({ example: 'Task queued for processing' })
  message!: string;
}
