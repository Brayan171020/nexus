import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { TaskEntity } from '../modules/tasks/entities/task.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [TaskEntity],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
