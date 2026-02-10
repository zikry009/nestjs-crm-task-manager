import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from 'src/common/enums/task-status.enum';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Title of the task' })
  @IsOptional({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @ApiPropertyOptional({ description: 'Description of the task' })
  @IsOptional({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiProperty({ description: 'Task status' })
  @IsNotEmpty({ message: 'Task status is required' })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status: TaskStatus;
}
