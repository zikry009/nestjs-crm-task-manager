import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotFoundException } from '@nestjs/common';

describe('TaskController', () => {
  let controller: TaskController;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Task 1',
      description: 'Task 1 description',
      assignedUserEmail: 'test@example.com',
      status: TaskStatus.TODO,
    };
    it('should create a new task', async () => {
      mockTaskService.create.mockResolvedValue({
        message: 'Task created successfully',
        statusCode: 201,
      });
      const result = await controller.create(createTaskDto);
      expect(result).toEqual({
        message: 'Task created successfully',
        statusCode: 201,
      });
    });
    it('should throw an error if user is not found', async () => {
      mockTaskService.create.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(controller.create(createTaskDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto);
    });
  });
  describe('findAll', () => {
    it('should return all tasks', async () => {
      const request = {
        decodedData: {
          role: Role.ADMIN,
          sub: 1,
        },
      };
      mockTaskService.findAll.mockResolvedValue({
        message: 'Tasks fetched successfully',
        statusCode: 200,
        data: [],
      });
      const result = await controller.findAll(
        request,
        TaskStatus.TODO,
        'Task 1',
      );
      expect(result).toEqual({
        message: 'Tasks fetched successfully',
        statusCode: 200,
        data: [],
      });
    });
  });
  describe('findOne', () => {
    it('should return a task', async () => {
      mockTaskService.findOne.mockImplementation(() => ({
        message: 'Task fetched successfully',
        statusCode: 200,
        data: {},
      }));
      const result = await controller.findOne('1');
      expect(result).toEqual({
        message: 'Task fetched successfully',
        statusCode: 200,
        data: {},
      });
    });
  });
  describe('update', () => {
    it('should update a task', async () => {
      mockTaskService.update.mockImplementation(() => ({
        message: 'Task updated successfully',
        statusCode: 200,
      }));
      const result = await controller.update('1', {
        title: 'Task 1',
        description: 'Task 1 description',
        status: TaskStatus.TODO,
      });
      expect(mockTaskService.update).toHaveBeenCalledWith(1, {
        title: 'Task 1',
        description: 'Task 1 description',
        status: TaskStatus.TODO,
      });
      expect(result).toEqual({
        message: 'Task updated successfully',
        statusCode: 200,
      });
    });
  });
  describe('delete', () => {
    it('should delete a task', async () => {
      mockTaskService.remove.mockImplementation(() => ({
        message: 'Task deleted successfully',
        statusCode: 200,
      }));
      const result = await controller.remove('1');
      expect(mockTaskService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Task deleted successfully',
        statusCode: 200,
      });
    });
  });
});
