import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './controllers/v1/tasks.controller';
import { TaskEntity } from './entities/task.entity';
import { TasksService } from './services/tasks.service';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity]), QueueModule, AuditModule, RealtimeModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TypeOrmModule],
})
export class TasksModule {}
