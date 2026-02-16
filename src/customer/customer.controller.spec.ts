import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { CreateCustomerTaskDto } from './dto/create-customer-task.dto';
import { NotFoundException } from '@nestjs/common';

describe('CustomerController', () => {
  let controller: CustomerController;
  const mockCustomerService = {
    create: jest.fn(),
    createCustomerTask: jest.fn(),
    assignTaskToCustomer: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      company: 'Example Inc.',
      contact: 1234567890,
    };
    it('should create a new customer', async () => {
      mockCustomerService.create.mockResolvedValue({
        message: 'Customer created successfully',
        statusCode: 201,
      });
      const result = await controller.create(createCustomerDto);
      expect(mockCustomerService.create).toHaveBeenCalledWith(
        createCustomerDto,
      );
      expect(result).toEqual({
        message: 'Customer created successfully',
        statusCode: 201,
      });
    });
    it('should throw an error if customer is not created', async () => {});
  });
  describe('createCustomerTask', () => {
    const createCustomerTaskDto: CreateCustomerTaskDto = {
      title: 'Task 1',
      description: 'Task 1 description',
      customerName: 'John Doe',
      status: TaskStatus.TODO,
      assignedUserEmail: 'test@example.com',
    };
    it('should create a new customer task', async () => {
      mockCustomerService.createCustomerTask.mockResolvedValue({
        message: 'Customer task created successfully',
        statusCode: 201,
      });
      const result = await controller.createCustomerTask(createCustomerTaskDto);
      expect(mockCustomerService.createCustomerTask).toHaveBeenCalledWith(
        createCustomerTaskDto,
      );
      expect(result).toEqual({
        message: 'Customer task created successfully',
        statusCode: 201,
      });
    });
    it('should throw an error if customer is not found', async () => {
      mockCustomerService.createCustomerTask.mockRejectedValue(
        new NotFoundException('Customer not found'),
      );
      await expect(
        controller.createCustomerTask(createCustomerTaskDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockCustomerService.createCustomerTask).toHaveBeenCalledWith(
        createCustomerTaskDto,
      );
    });
  });
  describe('assignTaskToCustomer', () => {
    const customerId = '1';
    const taskId = '1';
    it('should assign a task to a customer', async () => {
      mockCustomerService.assignTaskToCustomer.mockResolvedValue({
        message: 'Task assigned to customer successfully',
        statusCode: 200,
      });
      const result = await controller.assignTaskToCustomer(customerId, taskId);
      expect(mockCustomerService.assignTaskToCustomer).toHaveBeenCalledWith(
        customerId,
        taskId,
      );
      expect(result).toEqual({
        message: 'Task assigned to customer successfully',
        statusCode: 200,
      });
    });
    it('should throw an error if task is not found', async () => {
      mockCustomerService.assignTaskToCustomer.mockRejectedValue(
        new NotFoundException('Task not found'),
      );
      await expect(
        controller.assignTaskToCustomer(customerId, taskId),
      ).rejects.toThrow(NotFoundException);
      expect(mockCustomerService.assignTaskToCustomer).toHaveBeenCalledWith(
        customerId,
        taskId,
      );
    });
  });
  describe('findAll', () => {
    it('should return all customers', async () => {
      mockCustomerService.findAll.mockResolvedValue({
        message: 'Customers fetched successfully',
        statusCode: 200,
        data: [],
      });
      const result = await controller.findAll('ABC');
      expect(mockCustomerService.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Customers fetched successfully',
        statusCode: 200,
        data: [],
      });
    });
  });
});
