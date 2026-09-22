import { Body, Controller, HttpCode, HttpStatus, Post, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiAcceptedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from '../../dto/create-task.dto';
import { TaskResponseDto } from '../../dto/task-response.dto';
import { TaskEntity } from '../../entities/task.entity';
import { TasksService } from '../../services/tasks.service';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get task processing status and analysis' })
  getById(@Param('id') id: string): Promise<TaskEntity> {
    return this.tasksService.getById(id);
  }
}
