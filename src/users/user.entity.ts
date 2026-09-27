import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Todo } from '../todos/todo.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false, type: 'varchar' })
  name: string;

  @Column({ unique: true, length: 255, nullable: false, type: 'varchar' })
  email: string;

  @Column({ length: 255, nullable: false })
  passwordHash: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Relation<Todo[]>;

  @CreateDateColumn()
  createdAt: Date;
}
