import { Injectable } from '@nestjs/common';
import { AiTriageProvider, TriageInput } from '../interfaces/ai-triage-provider.interface';

@Injectable()
export class MockTriageAdapter implements AiTriageProvider {
  async analyze(input: TriageInput, signal: AbortSignal): Promise<unknown> {
    if (signal.aborted) throw new Error('Triage request aborted');
    const content = `${input.title} ${input.rawPayload}`.toLowerCase();
    const urgent = /urgent|critical|blocked|immediately/.test(content);
    const negative = /error|failure|failed|frustrat|urgent|critical/.test(content);
    return {
      category: /payment|billing|invoice/.test(content) ? 'BILLING' : /bug|error|failure/.test(content) ? 'BUG_REPORT' : 'UNCATEGORIZED',
      priority: urgent ? 'URGENT' : /error|failure|failed|escalat/.test(content) ? 'HIGH' : 'MEDIUM',
      sentiment: negative ? 'NEGATIVE' : 'NEUTRAL',
      summary: `${input.title}: ${input.rawPayload.slice(0, 240)}`,
      recommendedAction: urgent ? 'Escalate immediately' : 'Review and assign to the owning team',
      slaHours: urgent ? 1 : 24,
    };
  }
}
