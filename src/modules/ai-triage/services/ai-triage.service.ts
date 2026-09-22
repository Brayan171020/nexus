import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_TRIAGE_PROVIDER } from '../constants';
import { AiTriageProvider } from '../interfaces/ai-triage-provider.interface';
import { AiAnalysisResult, AiAnalysisResultSchema } from '../schemas/ai-analysis.schema';
import { sanitizePii } from '../utils/sanitize-pii';

@Injectable()
export class AiTriageService {
  private readonly logger = new Logger(AiTriageService.name);

  constructor(
    @Inject(AI_TRIAGE_PROVIDER) private readonly provider: AiTriageProvider,
    private readonly config: ConfigService,
  ) {}

  async analyze(title: string, rawPayload: string): Promise<AiAnalysisResult> {
    const input = { title: sanitizePii(title), rawPayload: sanitizePii(rawPayload) };
    const controller = new AbortController();
    const timeoutMs = this.config.get<number>('AI_TIMEOUT_MS', 8000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const rawResult = await this.provider.analyze(input, controller.signal);
      return this.parse(rawResult);
    } catch (error: unknown) {
      this.logger.warn(`AI triage fallback applied: ${error instanceof Error ? error.message : 'unknown provider error'}`);
      return this.fallback();
    } finally {
      clearTimeout(timeout);
    }
  }

  private parse(rawResult: unknown): AiAnalysisResult {
    let candidate: unknown = rawResult;
    if (typeof rawResult === 'string') {
      const normalized = rawResult.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      candidate = JSON.parse(normalized) as unknown;
    }
    return AiAnalysisResultSchema.parse(candidate);
  }

  private fallback(): AiAnalysisResult {
    return {
      category: 'UNCATEGORIZED',
      priority: 'MEDIUM',
      sentiment: 'NEUTRAL',
      summary: 'Auto-triage failed - fallback applied',
      recommendedAction: 'Review and triage manually',
      slaHours: 24,
    };
  }
}
