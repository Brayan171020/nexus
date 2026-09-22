import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './controllers/v1/tasks.controller';
import { TaskEntity } from './entities/task.entity';
import { TasksService } from './services/tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity]), QueueModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TypeOrmModule],
})
export class TasksModule {}
