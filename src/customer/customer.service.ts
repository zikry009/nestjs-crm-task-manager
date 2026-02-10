import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from 'src/entities/customer.entity';
import { Task } from 'src/entities/task.entity';
import { CreateCustomerTaskDto } from './dto/create-customer-task.dto';
import { User } from 'src/entities/user.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create(createCustomerDto);
    await this.customerRepository.save(customer);
    return {
      message: 'Customer created successfully',
      statusCode: 201,
    };
  }

  async createCustomerTask(createCustomerTaskDto: CreateCustomerTaskDto) {
    const customer = await this.customerRepository.findOne({
      where: { name: createCustomerTaskDto.customerName },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const user = await this.userRepository.findOne({
      where: { email: createCustomerTaskDto.assignedUserEmail },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const task = this.taskRepository.create({
      ...createCustomerTaskDto,
      customer: customer,
      assignedTo: user,
    });
    await this.taskRepository.save(task);
    return {
      message: 'Customer task created successfully',
      statusCode: 201,
    };
  }
  async assignTaskToCustomer(customerId: string, taskId: string) {
    const task = await this.taskRepository.findOne({
      where: { id: +taskId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const customer = await this.customerRepository.findOne({
      where: { id: +customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    task.customer = customer;
    await this.taskRepository.save(task);
    return {
      message: 'Task assigned to customer successfully',
      statusCode: 200,
    };
  }

  async findAll(customerName?: string) {
    const query = this.customerRepository.createQueryBuilder('customer');
    if (customerName) {
      query.andWhere('customer.name LIKE :name', { name: `%${customerName}%` });
    }
    const customers = await query.getMany();
    return {
      message: 'Customers fetched successfully',
      statusCode: 200,
      data: customers,
    };
  }
}
