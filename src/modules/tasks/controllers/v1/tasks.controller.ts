import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from '../../dto/create-task.dto';
import { TaskResponseDto } from '../../dto/task-response.dto';
import { TaskMetricsDto } from '../../dto/task-metrics.dto';
import { TaskMetrics, TasksService } from '../../services/tasks.service';
import { CorrelationId } from '../../../../common/decorators/correlation-id.decorator';
import { TaskAuditResponseDto } from '../../../audit/dto/task-audit-response.dto';

@ApiTags('Tasks')
@ApiSecurity('ApiKeyAuth')
@Controller({ path: 'tasks', version: '1' })
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue an unstructured task for processing' })
  @ApiAcceptedResponse({ type: TaskResponseDto })
  create(@Body() createTaskDto: CreateTaskDto, @CorrelationId() correlationId: string): Promise<TaskResponseDto> {
    return this.tasksService.create(createTaskDto, correlationId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get queue and persistence metrics' })
  @ApiOkResponse({ type: TaskMetricsDto })
  @ApiResponse({ status: 500, description: 'Infrastructure metrics unavailable' })
  getMetrics(): Promise<TaskMetrics> {
    return this.tasksService.getMetrics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task processing status and analysis' })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 500, description: 'Unexpected server error' })
  getById(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.tasksService.getById(id);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get the append-only audit timeline for a task' })
  @ApiOkResponse({ type: TaskAuditResponseDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Task not found' })
  getAudit(@Param('id') id: string): Promise<TaskAuditResponseDto[]> {
    return this.tasksService.getAudit(id);
  }
}
