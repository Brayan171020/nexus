export interface TriageInput {
  title: string;
  rawPayload: string;
}

export interface AiTriageProvider {
  analyze(input: TriageInput, signal: AbortSignal): Promise<unknown>;
}
