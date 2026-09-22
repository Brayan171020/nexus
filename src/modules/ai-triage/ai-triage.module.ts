import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_TRIAGE_PROVIDER } from './constants';
import { GeminiTriageAdapter } from './adapters/gemini-triage.adapter';
import { MockTriageAdapter } from './adapters/mock-triage.adapter';
import { AiTriageService } from './services/ai-triage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiTriageAdapter,
    MockTriageAdapter,
    AiTriageService,
    {
      provide: AI_TRIAGE_PROVIDER,
      inject: [ConfigService, GeminiTriageAdapter, MockTriageAdapter],
      useFactory: (config: ConfigService, gemini: GeminiTriageAdapter, mock: MockTriageAdapter) =>
        config.get<string>('AI_PROVIDER', 'mock') === 'gemini' ? gemini : mock,
    },
  ],
  exports: [AiTriageService],
})
export class AiTriageModule {}
