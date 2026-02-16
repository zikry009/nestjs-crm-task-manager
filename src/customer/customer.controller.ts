import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCustomerTaskDto } from './dto/create-customer-task.dto';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { Role } from 'src/common/enums/roles.enum';
import { Roles } from 'src/common/decorators/role.decorator';

@ApiBearerAuth('access-token')
@Controller('customer')
@ApiTags('Customer Management (Customer Controller)')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({
    type: CreateCustomerDto,
    examples: {
      createCustomer: {
        value: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Example Inc.',
          contact: 1234567890,
        },
        summary: 'Create a new customer',
      },
    },
  })
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Post('/create-task')
  @ApiOperation({ summary: 'Create a new customer task' })
  @ApiBody({
    type: CreateCustomerTaskDto,
    examples: {
      createCustomerTask: {
        value: {
          title: 'Task 1',
          description: 'Task 1 description',
          customerName: 'John Doe',
          status: TaskStatus.TODO,
          assignedUserEmail: 'test@example.com',
        },
        summary: 'Create a new customer task',
      },
    },
  })
  async createCustomerTask(
    @Body() createCustomerTaskDto: CreateCustomerTaskDto,
  ) {
    return this.customerService.createCustomerTask(createCustomerTaskDto);
  }

  @Put('/assign-task/:customerId/:taskId')
  @ApiOperation({ summary: 'Assign a task to a customer' })
  @ApiParam({ name: 'taskId', type: 'number', example: 1 })
  @ApiParam({ name: 'customerId', type: 'number', example: 1 })
  async assignTaskToCustomer(
    @Param('customerId') customerId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.customerService.assignTaskToCustomer(customerId, taskId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers(only Admin can access)' })
  @ApiQuery({ name: 'customerName', type: 'string', required: false })
  @Roles(Role.ADMIN)
  async findAll(@Query('customerName') customerName?: string) {
    return this.customerService.findAll(customerName);
  }
}
