import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Name of the customer' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({ description: 'Email of the customer' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ description: 'Company of the customer' })
  @IsNotEmpty({ message: 'Company is required' })
  @IsString({ message: 'Company must be a string' })
  company: string;

  @ApiProperty({ description: 'Contact of the customer' })
  @IsNotEmpty({ message: 'Contact is required' })
  @IsNumber({}, { message: 'Contact must be a number' })
  @Min(10, { message: 'Contact must be at least 10 digits' })
  contact: number;
}
