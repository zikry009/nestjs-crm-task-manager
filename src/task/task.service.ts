import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from 'src/entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { Role } from 'src/common/enums/roles.enum';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    const user = await this.userRepository.findOne({
      where: { email: createTaskDto.assignedUserEmail },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const task = this.taskRepository.create({
      ...createTaskDto,
      assignedTo: user,
    });
    await this.taskRepository.save(task);
    return {
      message: 'Task created successfully',
      statusCode: 201,
    };
  }

  async findAll(request: any, status?: TaskStatus, title?: string) {
    if (!request.decodedData) {
      throw new UnauthorizedException('Unauthorized Access');
    }
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedTo', 'assignedTo')
      .leftJoin('task.customer', 'customer')
      .select([
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

    if (request.decodedData.role === Role.USER) {
      query.andWhere('task.assignedToId = :userId', {
        userId: request.decodedData.sub,
      });
    }

    if (status) {
      query.andWhere('task.status LIKE:status', { status: `%${status}%` });
    }
    if (title) {
      query.andWhere('task.title LIKE :title', { title: `%${title}%` });
    }
    const tasks = await query.getMany();
    return {
      message: 'Tasks fetched successfully',
      statusCode: 200,
      data: tasks,
    };
  }

  async findOne(id: number) {
    const task = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedTo', 'assignedTo')
      .leftJoin('task.customer', 'customer')
      .select([
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
      ])
      .where('task.id = :id', { id })
      .getOne();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return {
      message: 'Task fetched successfully',
      statusCode: 200,
      data: task,
    };
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = this.taskRepository.create({
      ...updateTaskDto,
    });
    await this.taskRepository.update(id, task);
    return {
      message: 'Task updated successfully',
      statusCode: 200,
    };
  }

  async remove(id: number) {
    const task = await this.taskRepository.findOne({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.taskRepository.delete(id);
    return {
      message: 'Task deleted successfully',
      statusCode: 200,
    };
  }
}
