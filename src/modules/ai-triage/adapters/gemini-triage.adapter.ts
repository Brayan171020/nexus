import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiTriageProvider, TriageInput } from '../interfaces/ai-triage-provider.interface';

interface GeminiPart { text?: string }
interface GeminiCandidate { content?: { parts?: GeminiPart[] } }
interface GeminiResponse { candidates?: GeminiCandidate[] }

@Injectable()
export class GeminiTriageAdapter implements AiTriageProvider {
  constructor(private readonly config: ConfigService) {}

  async analyze(input: TriageInput, signal: AbortSignal): Promise<unknown> {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    const model = this.config.getOrThrow<string>('GEMINI_MODEL');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: this.prompt(input) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
    const body: unknown = await response.json();
    const text = this.extractText(body);
    if (!text) throw new Error('Gemini returned no structured content');
    return text;
  }

  private prompt(input: TriageInput): string {
    return `Return only valid JSON with keys category, priority, sentiment, summary, recommendedAction, slaHours.\nAllowed priority: LOW, MEDIUM, HIGH, URGENT. Allowed sentiment: POSITIVE, NEUTRAL, NEGATIVE, FRUSTRATED.\nTitle: ${input.title}\nPayload: ${input.rawPayload}`;
  }

  private extractText(body: unknown): string | null {
    if (!this.isRecord(body)) return null;
    const candidates = body.candidates;
    if (!Array.isArray(candidates)) return null;
    const first = candidates[0];
    if (!this.isRecord(first) || !this.isRecord(first.content) || !Array.isArray(first.content.parts)) return null;
    const part = first.content.parts[0];
    return this.isRecord(part) && typeof part.text === 'string' ? part.text : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
