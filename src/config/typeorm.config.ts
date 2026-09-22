import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TaskEntity } from '../modules/tasks/entities/task.entity';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.getOrThrow<string>('DATABASE_URL'),
  ssl: { rejectUnauthorized: false },
  entities: [TaskEntity],
  synchronize: config.get<string>('NODE_ENV') !== 'production',
  autoLoadEntities: true,
});
