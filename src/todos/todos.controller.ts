import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtUser } from '../auth/jwt.strategy.js';
import { ApiResponse } from '../utils/responses/api-response.js';
import { errorMessages, successMessages } from '../utils/properties.utils.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodosService } from './todos.service.js';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  async findAll(
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse> {
    const todos = await this.todosService.findAll(this.requireUserId(request));
    return new ApiResponse(HttpStatus.OK, successMessages.TODOS_FETCHED, todos);
  }

  @Post()
  async create(
    @Body() createTodoDto: CreateTodoDto,
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse> {
    const todo = await this.todosService.create(
      this.requireUserId(request),
      createTodoDto,
    );
    return new ApiResponse(
      HttpStatus.CREATED,
      successMessages.TODO_CREATED,
      todo,
    );
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse> {
    const todo = await this.todosService.update(
      this.requireUserId(request),
      id,
      updateTodoDto,
    );
    return new ApiResponse(HttpStatus.OK, successMessages.TODO_UPDATED, todo);
  }

  @Patch(':id/done')
  async toggleDone(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse> {
    const todo = await this.todosService.toggleDone(
      this.requireUserId(request),
      id,
    );
    return new ApiResponse(
      HttpStatus.OK,
      successMessages.TODO_STATUS_UPDATED,
      todo,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse> {
    await this.todosService.remove(this.requireUserId(request), id);
    return new ApiResponse(HttpStatus.OK, successMessages.TODO_DELETED);
  }

  private requireUserId(request: Request & { user?: JwtUser }): string {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(errorMessages.SESSION_NOT_FOUND);
    }
    return userId;
  }
}
