import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Task } from 'src/entities/task.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => {
      return {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
        where: jest.fn().mockReturnThis(),
      };
    }) as jest.Mock,
  };
  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
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

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get(getRepositoryToken(Task));
    userRepository = module.get(getRepositoryToken(User));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(taskRepository).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Task 1',
      description: 'Task 1 description',
      assignedUserEmail: 'test@example.com',
      status: TaskStatus.TODO,
    };
    const mockUser = { id: 1, email: 'test@example.com' } as User;
    it('should create a new task', async () => {
      const mockTask = {
        ...createTaskDto,
        assignedTo: mockUser,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      const result = await service.create(createTaskDto);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createTaskDto.assignedUserEmail },
      });
      expect(mockTaskRepository.create).toHaveBeenCalledWith(mockTask);
      expect(mockTaskRepository.save).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual({
        message: 'Task created successfully',
        statusCode: 201,
      });
    });
    it('should throw an error if user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.create(createTaskDto)).rejects.toThrow(
        'User not found',
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createTaskDto.assignedUserEmail },
      });
    });
  });

  describe('findAll', () => {
    const requestAdmin = {
      decodedData: {
        role: Role.ADMIN,
        sub: 1,
      },
    };
    const requestUser = {
      decodedData: {
        role: Role.USER,
        sub: 1,
      },
    };
    it('should return excepetion if user is not authenticated', async () => {
      await expect(service.findAll({})).rejects.toThrow('Unauthorized Access');
    });
    it('should return all tasks for admin without status and title', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });
      const result = await service.findAll(requestAdmin);
      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.assignedTo', 'assignedTo');
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.customer', 'customer');
      expect(
        mockTaskRepository.createQueryBuilder().select,
      ).toHaveBeenCalledWith([
        'task.id',
        'task.title',
        'task.status',
        'task.description',
        'task.dueDate',
        'assignedTo.id',
        'assignedTo.name',
        'assignedTo.email',
        'assignedTo.role',
        'customer.id',
        'customer.name',
        'customer.email',
        'customer.company',
        'customer.contact',
      ]);
      expect(
        mockTaskRepository.createQueryBuilder().getMany,
      ).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Tasks fetched successfully',
        statusCode: 200,
        data: [],
      });
    });
    it('should return all tasks for admin with status and title', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });
      const result = await service.findAll(
        requestAdmin,
        TaskStatus.TODO,
        'Task 1',
      );
      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.assignedTo', 'assignedTo');
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.customer', 'customer');
      expect(
        mockTaskRepository.createQueryBuilder().select,
      ).toHaveBeenCalledWith([
        'task.id',
        'task.title',
        'task.status',
        'task.description',
        'task.dueDate',
        'assignedTo.id',
        'assignedTo.name',
        'assignedTo.email',
        'assignedTo.role',
        'customer.id',
        'customer.name',
        'customer.email',
        'customer.company',
        'customer.contact',
      ]);
      expect(
        mockTaskRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('task.status LIKE:status', {
        status: `%${TaskStatus.TODO}%`,
      });
      expect(
        mockTaskRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('task.title LIKE :title', {
        title: `%${'Task 1'}%`,
      });
      expect(
        mockTaskRepository.createQueryBuilder().getMany,
      ).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Tasks fetched successfully',
        statusCode: 200,
        data: [],
      });
    });
    it('should return all tasks for user without status and title', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });
      const result = await service.findAll(requestUser);
      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.assignedTo', 'assignedTo');
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.customer', 'customer');
      expect(
        mockTaskRepository.createQueryBuilder().select,
      ).toHaveBeenCalledWith([
        'task.id',
        'task.title',
        'task.status',
        'task.description',
        'task.dueDate',
        'assignedTo.id',
        'assignedTo.name',
        'assignedTo.email',
        'assignedTo.role',
        'customer.id',
        'customer.name',
        'customer.email',
        'customer.company',
        'customer.contact',
      ]);
      expect(
        mockTaskRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledWith('task.assignedToId = :userId', {
        userId: requestUser.decodedData.sub,
      });
      expect(
        mockTaskRepository.createQueryBuilder().getMany,
      ).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Tasks fetched successfully',
        statusCode: 200,
        data: [],
      });
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      const mockTask = { id: 1, title: 'Task 1' } as Task;
      mockTaskRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockTask),
      });
      const result = await service.findOne(1);
      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.assignedTo', 'assignedTo');
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.customer', 'customer');
      expect(
        mockTaskRepository.createQueryBuilder().select,
      ).toHaveBeenCalledWith([
        'task.id',
        'task.title',
        'task.status',
        'task.description',
        'task.dueDate',
        'assignedTo.id',
        'assignedTo.name',
        'assignedTo.email',
        'assignedTo.role',
        'customer.id',
        'customer.name',
        'customer.email',
        'customer.company',
        'customer.contact',
      ]);
      expect(
        mockTaskRepository.createQueryBuilder().where,
      ).toHaveBeenCalledWith('task.id = :id', { id: 1 });
      expect(mockTaskRepository.createQueryBuilder().getOne).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Task fetched successfully',
        statusCode: 200,
        data: mockTask,
      });
    });
    it('should throw an error if task is not found', async () => {
      mockTaskRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findOne(1)).rejects.toThrow('Task not found');
      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.assignedTo', 'assignedTo');
      expect(
        mockTaskRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledWith('task.customer', 'customer');
      expect(
        mockTaskRepository.createQueryBuilder().select,
      ).toHaveBeenCalledWith([
        'task.id',
        'task.title',
        'task.status',
        'task.description',
        'task.dueDate',
        'assignedTo.id',
        'assignedTo.name',
        'assignedTo.email',
        'assignedTo.role',
        'customer.id',
        'customer.name',
        'customer.email',
        'customer.company',
        'customer.contact',
      ]);
      expect(
        mockTaskRepository.createQueryBuilder().where,
      ).toHaveBeenCalledWith('task.id = :id', { id: 1 });
      expect(mockTaskRepository.createQueryBuilder().getOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const mockTask = {
        id: 1,
        title: 'Task 2',
        description: 'Task 2 description',
        status: TaskStatus.TODO,
      } as Task;
      const updateTaskDto: UpdateTaskDto = {
        title: 'Task 2',
        description: 'Task 2 description',
        status: TaskStatus.TODO,
      };
      mockTaskRepository.create.mockReturnValue(updateTaskDto);
      mockTaskRepository.update.mockResolvedValue(mockTask);
      const result = await service.update(1, updateTaskDto);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(updateTaskDto);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(1, updateTaskDto);
      expect(result).toEqual({
        message: 'Task updated successfully',
        statusCode: 200,
      });
    });
  });
});
