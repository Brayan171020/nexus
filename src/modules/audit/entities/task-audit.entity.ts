import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TaskEntity } from '../../tasks/entities/task.entity';

@Entity({ name: 'task_audit_history' })
@Index(['taskId', 'createdAt'])
export class TaskAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  taskId!: string;

  @ManyToOne(() => TaskEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'taskId' })
  task!: TaskEntity;

  @Column({ type: 'varchar', length: 32, nullable: true })
  previousStatus!: string | null;

  @Column({ type: 'varchar', length: 32 })
  newStatus!: string;

  @Column({ type: 'varchar', length: 128 })
  correlationId!: string;

  @Column({ type: 'varchar', length: 64 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt!: Date;
}
