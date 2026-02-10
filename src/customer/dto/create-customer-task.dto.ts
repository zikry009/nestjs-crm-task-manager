import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TaskStatus } from 'src/common/enums/task-status.enum';

export class CreateCustomerTaskDto {
  @ApiProperty({ description: 'Title of the task' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @ApiProperty({ description: 'Description of the task' })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;

  @ApiProperty({ description: 'Customer name' })
  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString({ message: 'Customer name must be a string' })
  customerName: string;

  @ApiProperty({ description: 'Task status' })
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status: TaskStatus;

  @ApiProperty({ description: 'User email id' })
  @IsNotEmpty({ message: 'User email id is required' })
  @IsEmail({}, { message: 'Invalid email' })
  assignedUserEmail: string;
}
