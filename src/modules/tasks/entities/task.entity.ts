import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TaskStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface AiAnalysis {
  summary: string;
  sentiment: string;
  recommendedAction: string;
}

export interface TaskErrorDetails {
  name: string;
  message: string;
  stack?: string;
  attempt: number;
  failedAt: string;
}

@Entity({ name: 'tasks' })
@Index(['status', 'createdAt'])
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  rawPayload!: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status!: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, nullable: true })
  priority!: TaskPriority | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  aiAnalysis!: AiAnalysis | null;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  errorDetails!: TaskErrorDetails | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
