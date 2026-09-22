import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CorrelatedRequest } from '../interfaces/correlated-request.interface';

export const CorrelationId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<CorrelatedRequest>();
  return request.correlationId ?? request.header('x-correlation-id') ?? 'unknown';
});
