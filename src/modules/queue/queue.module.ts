import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTriageModule } from '../ai-triage/ai-triage.module';
import { TaskEntity } from '../tasks/entities/task.entity';
import { TaskProcessor } from './processors/task.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'tasks' }), TypeOrmModule.forFeature([TaskEntity]), AiTriageModule],
  providers: [TaskProcessor],
  exports: [BullModule],
})
export class QueueModule {}
