import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';
import { CorrelatedRequest } from '../interfaces/correlated-request.interface';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(request: CorrelatedRequest, response: Response, next: NextFunction): void {
    const correlationId = request.header('x-correlation-id')?.trim() || randomUUID();
    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);
    const startedAt = Date.now();
    response.on('finish', () => {
      this.logger.log(JSON.stringify({ correlationId, timestamp: new Date().toISOString(), method: request.method, path: request.originalUrl, durationMs: Date.now() - startedAt, statusCode: response.statusCode }));
    });
    next();
  }
}
