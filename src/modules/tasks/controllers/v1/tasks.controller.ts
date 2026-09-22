import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from '../../dto/create-task.dto';
import { TaskResponseDto } from '../../dto/task-response.dto';
import { TaskMetricsDto } from '../../dto/task-metrics.dto';
import { TaskMetrics, TasksService } from '../../services/tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller({ path: 'tasks', version: '1' })
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue an unstructured task for processing' })
  @ApiAcceptedResponse({ type: TaskResponseDto })
  create(@Body() createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.tasksService.create(createTaskDto);
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
}
