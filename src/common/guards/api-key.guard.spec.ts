import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as unknown as Reflector;
  const config = { get: jest.fn((key: string, fallback?: unknown) => key === 'API_AUTH_ENABLED' ? true : key === 'API_KEY_SECRET' ? 'a'.repeat(32) : fallback) } as unknown as ConfigService;
  const context = (headers: Record<string, string>): ExecutionContext => ({
    getHandler: jest.fn(), getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ header: (name: string) => headers[name] }) }),
  } as unknown as ExecutionContext);

  it('rejects requests without a valid key', () => {
    const guard = new ApiKeyGuard(config, reflector);
    expect(() => guard.canActivate(context({}))).toThrow(UnauthorizedException);
  });

  it('accepts a valid x-api-key', () => {
    const guard = new ApiKeyGuard(config, reflector);
    expect(guard.canActivate(context({ 'x-api-key': 'a'.repeat(32) }))).toBe(true);
  });
});
