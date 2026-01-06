import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { ObjectType, Field, ID, Int } from "type-graphql";
import { Task } from "./Task";
import { User } from "./User";

@ObjectType()
@Entity()
export class TaskUpdate {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  taskId: string;

  @Field(() => Task)
  @ManyToOne(() => Task, task => task.updates)
  task: Task;

  @Field()
  @Column()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.taskUpdates)
  user: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes?: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  progress?: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
