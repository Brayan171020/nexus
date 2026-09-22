import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAuditEntity } from '../entities/task-audit.entity';

export interface AuditEntry {
  taskId: string;
  previousStatus: string | null;
  newStatus: string;
  correlationId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(TaskAuditEntity) private readonly auditRepository: Repository<TaskAuditEntity>) {}

  async record(entry: AuditEntry): Promise<TaskAuditEntity> {
    const audit = this.auditRepository.create({ ...entry, metadata: entry.metadata ?? null });
    return this.auditRepository.save(audit);
  }

  findByTaskId(taskId: string): Promise<TaskAuditEntity[]> {
    return this.auditRepository.find({ where: { taskId }, order: { createdAt: 'ASC' } });
  }
}
