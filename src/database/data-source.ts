import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { TaskEntity } from '../modules/tasks/entities/task.entity';
import { TaskAuditEntity } from '../modules/audit/entities/task-audit.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [TaskEntity, TaskAuditEntity],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
