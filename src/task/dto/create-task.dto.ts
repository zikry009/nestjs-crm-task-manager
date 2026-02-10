import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TaskStatus } from 'src/common/enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ description: 'Title of the task' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @ApiProperty({ description: 'Description of the task' })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiProperty({ description: 'User assigned email Id' })
  @IsNotEmpty({ message: 'User assigned email Id is required' })
  @IsEmail({}, { message: 'Invalid email' })
  assignedUserEmail: string;

  @ApiProperty({ description: 'Task status' })
  @IsNotEmpty({ message: 'Task status is required' })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status: TaskStatus;
}
