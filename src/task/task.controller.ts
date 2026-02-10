import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TaskStatus } from 'src/common/enums/task-status.enum';

@ApiBearerAuth('access-token')
@Controller('task')
@ApiTags('Task Management (Task Controller)')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({
    type: CreateTaskDto,
    examples: {
      createTask: {
        value: {
          title: 'Task 1',
          description: 'Task 1 description',
          assignedUserEmail: 'test@example.com',
          status: TaskStatus.TODO,
        },
        summary: 'Create a new task',
      },
    },
  })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiQuery({
    name: 'status',
    type: 'enum',
    enum: TaskStatus,
    example: TaskStatus.TODO,
    required: false,
  })
  @ApiQuery({
    name: 'title',
    type: 'string',
    example: 'Task 1',
    required: false,
  })
  findAll(
    @Req() request: any,
    @Query('status') status?: TaskStatus,
    @Query('title') title?: string,
  ) {
    return this.taskService.findAll(request, status, title);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task by id' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiBody({
    type: UpdateTaskDto,
    examples: {
      updateTask: {
        value: {
          title: 'Task 1',
          description: 'Task 1 description',
          status: TaskStatus.TODO,
        },
        summary: 'Update a task',
      },
    },
  })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by id' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
