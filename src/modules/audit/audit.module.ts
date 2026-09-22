import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskAuditEntity } from './entities/task-audit.entity';
import { AuditService } from './services/audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskAuditEntity])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
