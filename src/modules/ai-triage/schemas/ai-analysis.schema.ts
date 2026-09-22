import { z } from 'zod';

export const AiAnalysisResultSchema = z.object({
  category: z.string().trim().min(1).max(64),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FRUSTRATED']),
  summary: z.string().trim().min(1).max(500),
  recommendedAction: z.string().trim().min(1).max(500),
  slaHours: z.number().finite().positive().max(8760),
});

export type AiAnalysisResult = z.infer<typeof AiAnalysisResultSchema>;
