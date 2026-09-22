import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TaskStatus } from '../tasks/entities/task.entity';
import { TaskCompletedEvent, TaskFailedEvent, TaskStatusUpdatedEvent } from './events/task-events';

@WebSocketGateway({ namespace: '/tasks-events', cors: { origin: '*' } })
export class TasksGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(TasksGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(): void {
    this.logger.log('Tasks realtime gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Realtime client connected: ${client.id}`);
  }

  @SubscribeMessage('joinTask')
  joinTask(@ConnectedSocket() client: Socket, @MessageBody() taskId: string): { joined: boolean; taskId: string } {
    const room = this.room(taskId);
    void client.join(room);
    return { joined: true, taskId };
  }

  emitStatusUpdated(event: TaskStatusUpdatedEvent): void {
    this.server?.to(this.room(event.taskId)).emit('task:status-updated', event);
  }

  emitCompleted(event: TaskCompletedEvent): void {
    this.server?.to(this.room(event.taskId)).emit('task:completed', event);
  }

  emitFailed(event: TaskFailedEvent): void {
    this.server?.to(this.room(event.taskId)).emit('task:failed', event);
  }

  private room(taskId: string): string {
    return `task:${taskId}`;
  }
}
