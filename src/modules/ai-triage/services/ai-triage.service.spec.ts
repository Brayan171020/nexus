import { ConfigService } from '@nestjs/config';
import { AiTriageProvider, TriageInput } from '../interfaces/ai-triage-provider.interface';
import { AiTriageService } from './ai-triage.service';

describe('AiTriageService', () => {
  const config = { get: jest.fn().mockReturnValue(8000) } as unknown as ConfigService;
  const validResult = {
    category: 'BUG_REPORT',
    priority: 'HIGH',
    sentiment: 'FRUSTRATED',
    summary: 'A payment bug is blocking checkout.',
    recommendedAction: 'Assign to the payments engineering team.',
    slaHours: 4,
  };

  it('validates a structured provider response before returning it', async () => {
    const provider: AiTriageProvider = { analyze: jest.fn().mockResolvedValue(JSON.stringify(validResult)) };
    const service = new AiTriageService(provider, config);

    await expect(service.analyze('Payment bug', 'Checkout is blocked')).resolves.toEqual(validResult);
  });

  it('applies the deterministic fallback when the provider fails', async () => {
    const provider: AiTriageProvider = { analyze: jest.fn().mockRejectedValue(new Error('rate limit')) };
    const service = new AiTriageService(provider, config);

    await expect(service.analyze('Any task', 'Any payload')).resolves.toMatchObject({
      category: 'UNCATEGORIZED', priority: 'MEDIUM', summary: 'Auto-triage failed - fallback applied',
    });
  });

  it('sanitizes PII before invoking the provider', async () => {
    let received: TriageInput | undefined;
    const provider: AiTriageProvider = {
      analyze: jest.fn().mockImplementation(async (input: TriageInput) => {
        received = input;
        return validResult;
      }),
    };
    const service = new AiTriageService(provider, config);

    await service.analyze('Contact alice@example.com', 'password=secret123 card 4111 1111 1111 1111');

    expect(received?.title).toContain('[REDACTED_EMAIL]');
    expect(received?.rawPayload).toContain('[REDACTED_SECRET]');
    expect(received?.rawPayload).toContain('[REDACTED_CARD]');
    expect(received?.rawPayload).not.toContain('secret123');
  });
});
