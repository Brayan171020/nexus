import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { envValidationSchema } from './config/env.validation';
import { typeOrmConfig } from './config/typeorm.config';
import { redisConfig } from './config/redis.config';
import { TasksModule } from './modules/tasks/tasks.module';
import { QueueModule } from './modules/queue/queue.module';
import { AiTriageModule } from './modules/ai-triage/ai-triage.module';
import { HealthModule } from './modules/health/health.module';
import { APP_GUARD } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AuditModule } from './modules/audit/audit.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validationSchema: envValidationSchema }),
    TypeOrmModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: typeOrmConfig }),
    BullModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: redisConfig }),
    AiTriageModule,
    QueueModule,
    TasksModule,
    HealthModule,
    AuditModule,
    RealtimeModule,
  ],
  providers: [{ provide: APP_GUARD, useFactory: (config: ConfigService, reflector: Reflector) => new ApiKeyGuard(config, reflector), inject: [ConfigService, Reflector] }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
