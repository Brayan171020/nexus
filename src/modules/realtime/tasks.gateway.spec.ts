import { Socket } from 'socket.io';
import { TasksGateway } from './tasks.gateway';
import { TaskStatus } from '../tasks/entities/task.entity';

describe('TasksGateway', () => {
  it('emits strongly-shaped task events to the task room', () => {
    const emit = jest.fn();
    const gateway = new TasksGateway();
    gateway.server = { to: jest.fn().mockReturnValue({ emit }) } as never;

    gateway.emitStatusUpdated({ taskId: 'task-1', status: TaskStatus.PROCESSING, retryCount: 1, timestamp: 'now' });
    gateway.emitCompleted({ taskId: 'task-1', status: TaskStatus.COMPLETED, aiAnalysis: { summary: 'Done', sentiment: 'NEUTRAL', recommendedAction: 'Close', slaHours: 24 }, processedAt: 'now' });

    expect(emit).toHaveBeenNthCalledWith(1, 'task:status-updated', expect.objectContaining({ taskId: 'task-1', status: TaskStatus.PROCESSING }));
    expect(emit).toHaveBeenNthCalledWith(2, 'task:completed', expect.objectContaining({ status: TaskStatus.COMPLETED }));
  });

  it('joins a client to a task-specific room', () => {
    const join = jest.fn().mockResolvedValue(undefined);
    const gateway = new TasksGateway();
    const response = gateway.joinTask({ join } as unknown as Socket, 'task-2');

    expect(response).toEqual({ joined: true, taskId: 'task-2' });
    expect(join).toHaveBeenCalledWith('task:task-2');
  });
});
