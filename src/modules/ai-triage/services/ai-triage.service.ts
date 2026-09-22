import { Injectable } from '@nestjs/common';
import { AiAnalysis, TaskPriority } from '../../tasks/entities/task.entity';

export interface TriageResult {
  priority: TaskPriority;
  category: string;
  analysis: AiAnalysis;
}

@Injectable()
export class AiTriageService {
  analyze(title: string, rawPayload: string): TriageResult {
    const content = `${title} ${rawPayload}`.toLowerCase();
    const priority = /urgent|critical|blocked|immediately/.test(content) ? TaskPriority.URGENT
      : /error|failure|failed|escalat/.test(content) ? TaskPriority.HIGH
        : /question|request|help/.test(content) ? TaskPriority.MEDIUM : TaskPriority.LOW;
    const category = /payment|billing|invoice/.test(content) ? 'billing'
      : /bug|error|failure|incident/.test(content) ? 'technical' : 'general';
    return {
      priority,
      category,
      analysis: {
        summary: `${title}: ${rawPayload.slice(0, 240)}`,
        sentiment: /urgent|critical|error|failure/.test(content) ? 'negative' : 'neutral',
        recommendedAction: priority === TaskPriority.URGENT ? 'Escalate immediately' : 'Review and assign',
      },
    };
  }
}
