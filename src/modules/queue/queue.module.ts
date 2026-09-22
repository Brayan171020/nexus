import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTriageModule } from '../ai-triage/ai-triage.module';
import { TaskEntity } from '../tasks/entities/task.entity';
import { TaskProcessor } from './processors/task.processor';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'tasks',
        defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000, jitter: 0.5 }, removeOnComplete: false, removeOnFail: false },
      },
      { name: 'tasks-dlq', defaultJobOptions: { removeOnComplete: false, removeOnFail: false } },
    ),
    TypeOrmModule.forFeature([TaskEntity]),
    AiTriageModule,
    AuditModule,
    RealtimeModule,
  ],
  providers: [TaskProcessor],
  exports: [BullModule],
})
export class QueueModule {}
