import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { errorMessages } from '../utils/properties.utils.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { Todo } from './todo.entity.js';

export type TodoResponse = {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async findAll(userId: string): Promise<TodoResponse[]> {
    const todos = await this.todoRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    return todos.map((todo) => this.toResponse(todo));
  }

  async create(userId: string, dto: CreateTodoDto): Promise<TodoResponse> {
    const todo = await this.todoRepository.save(
      this.todoRepository.create({
        title: dto.title,
        description: dto.description ?? null,
        user: { id: userId },
      }),
    );
    return this.toResponse(todo);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTodoDto,
  ): Promise<TodoResponse> {
    if (dto.title === undefined && dto.description === undefined) {
      throw new BadRequestException(errorMessages.TODO_UPDATE_EMPTY);
    }

    const todo = await this.findOwnedTodo(userId, id);
    if (dto.title !== undefined) {
      todo.title = dto.title;
    }
    if (dto.description !== undefined) {
      todo.description = dto.description;
    }

    const updated = await this.todoRepository.save(todo);
    return this.toResponse(updated);
  }

  async toggleDone(userId: string, id: string): Promise<TodoResponse> {
    const todo = await this.findOwnedTodo(userId, id);
    todo.done = !todo.done;
    const updated = await this.todoRepository.save(todo);
    return this.toResponse(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const todo = await this.findOwnedTodo(userId, id);
    await this.todoRepository.remove(todo);
  }

  private async findOwnedTodo(userId: string, id: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!todo) {
      throw new NotFoundException(errorMessages.TODO_NOT_FOUND);
    }
    return todo;
  }

  private toResponse(todo: Todo): TodoResponse {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      done: todo.done,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }
}
