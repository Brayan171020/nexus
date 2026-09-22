import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService, private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic || !this.config.get<boolean>('API_AUTH_ENABLED', false)) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const headerKey = request.header('x-api-key');
    const authorization = request.header('authorization');
    const authorizationKey = authorization?.startsWith('ApiKey ') ? authorization.slice('ApiKey '.length).trim() : undefined;
    const providedKey = headerKey?.trim() || authorizationKey;
    const configuredKey = this.config.get<string>('API_KEY_SECRET');
    if (!providedKey || !configuredKey || providedKey !== configuredKey) throw new UnauthorizedException('Invalid API key');
    return true;
  }
}
