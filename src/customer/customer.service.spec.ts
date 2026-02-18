import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { Customer } from 'src/entities/customer.entity';
import { Task } from 'src/entities/task.entity';
import { User } from 'src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { CreateCustomerTaskDto } from './dto/create-customer-task.dto';
import { Repository } from 'typeorm';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: Repository<Customer>;
  let taskRepository: Repository<Task>;
  let userRepository: Repository<User>;
  const mockCustomerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => {
      return {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };
    }) as jest.Mock,
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get(getRepositoryToken(Customer));
    taskRepository = module.get(getRepositoryToken(Task));
    userRepository = module.get(getRepositoryToken(User));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(customerRepository).toBeDefined();
    expect(taskRepository).toBeDefined();
    expect(userRepository).toBeDefined();
  });
  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      company: 'Example Inc.',
      contact: 1234567890,
    };

    it('should create a new customer', async () => {
      const mockCustomer = { id: 1, ...createCustomerDto };
      mockCustomerRepository.create.mockReturnValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);
      const result = await service.create(createCustomerDto);
      expect(mockCustomerRepository.create).toHaveBeenCalledWith(
        createCustomerDto,
      );
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(mockCustomer);
      expect(result).toEqual({
        message: 'Customer created successfully',
        statusCode: 201,
      });
    });

    it('should call create once and save once', async () => {
      const mockCustomer = { id: 1, ...createCustomerDto };
      mockCustomerRepository.create.mockReturnValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);
      await service.create(createCustomerDto);
      expect(mockCustomerRepository.create).toHaveBeenCalledTimes(1);
      expect(mockCustomerRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate error when save fails', async () => {
      const mockCustomer = { id: 1, ...createCustomerDto };
      const dbError = new Error('Database connection failed');
      mockCustomerRepository.create.mockReturnValue(mockCustomer);
      mockCustomerRepository.save.mockRejectedValue(dbError);
      await expect(service.create(createCustomerDto)).rejects.toThrow(dbError);
    });
  });

  describe('createCustomerTask', () => {
    const createCustomerTaskDto: CreateCustomerTaskDto = {
      title: 'Task 1',
      description: 'Task 1 description',
      customerName: 'John Doe',
      status: TaskStatus.TODO,
      assignedUserEmail: 'test@example.com',
    };
    const mockCustomer = {
      id: 1,
      name: 'ABC',
      customerName: 'John Doe',
    } as Partial<Customer>;
    const mockUser = { id: 10, email: 'test@test.com' } as User;
    it('should create a new customer task', async () => {
      const mockTask = {
        id: 100,
        title: 'Task 1',
        description: 'Task 1 description',
        status: TaskStatus.TODO,
        assignedTo: mockUser,
        customer: mockCustomer,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Task;
      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      const result = await service.createCustomerTask(createCustomerTaskDto);
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { name: createCustomerTaskDto.customerName },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createCustomerTaskDto.assignedUserEmail },
      });
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...createCustomerTaskDto,
        assignedTo: mockUser,
        customer: mockCustomer,
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual({
        message: 'Customer task created successfully',
        statusCode: 201,
      });
    });
    it('should throw an error if customer is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createCustomerTask(createCustomerTaskDto),
      ).rejects.toThrow('Customer not found');
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { name: createCustomerTaskDto.customerName },
      });
    });

    it('should throw an error if user is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createCustomerTask(createCustomerTaskDto),
      ).rejects.toThrow('User not found');
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { name: createCustomerTaskDto.customerName },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createCustomerTaskDto.assignedUserEmail },
      });
    });
  });

  describe('assignTaskToCustomer', () => {
    const customerId = '1';
    const taskId = '1';
    const mockCustomer = { id: 1, name: 'ABC' } as Partial<Customer>;
    const mockTask = { id: 100, title: 'Task 1' } as Partial<Task>;
    it('should assign a task to a customer', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      const result = await service.assignTaskToCustomer(customerId, taskId);
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { id: +customerId },
      });
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: +taskId },
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith({
        ...mockTask,
        customer: mockCustomer,
      });
      expect(result).toEqual({
        message: 'Task assigned to customer successfully',
        statusCode: 200,
      });
    });
    it('should throw an error if task is not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);
      await expect(
        service.assignTaskToCustomer(customerId, taskId),
      ).rejects.toThrow('Task not found');
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: +taskId },
      });
    });
    it('should throw an error if customer is not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(taskId);
      mockCustomerRepository.findOne.mockResolvedValue(null);
      await expect(
        service.assignTaskToCustomer(customerId, taskId),
      ).rejects.toThrow('Customer not found');
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: +taskId },
      });
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { id: +customerId },
      });
    });
  });

  describe('findAll', () => {
    const customerName = 'ABC';
    it('should return all customers', async () => {
      mockCustomerRepository.createQueryBuilder.mockReturnValue({
        andWhere: jest.fn(),
        getMany: jest.fn().mockResolvedValue([]),
      });
      const result = await service.findAll(customerName);
      expect(mockCustomerRepository.createQueryBuilder).toHaveBeenCalledWith(
        'customer',
      );
      expect(
        mockCustomerRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('customer.name LIKE :name', {
        name: `%${customerName}%`,
      });
      expect(result).toEqual({
        message: 'Customers fetched successfully',
        statusCode: 200,
        data: [],
      });
    });
    it('should return all customers with customer name', async () => {
      mockCustomerRepository.createQueryBuilder.mockReturnValue({
        getMany: jest.fn().mockResolvedValue([]),
      });
      const result = await service.findAll('');
      expect(mockCustomerRepository.createQueryBuilder).toHaveBeenCalledWith(
        'customer',
      );

      expect(result).toEqual({
        message: 'Customers fetched successfully',
        statusCode: 200,
        data: [],
      });
    });
  });
});
