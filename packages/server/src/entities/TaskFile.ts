import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Task } from "./Task";

@ObjectType()
@Entity()
export class TaskFile {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  taskId: string;

  @Field(() => Task)
  @ManyToOne(() => Task, task => task.completionFiles)
  task: Task;

  @Field()
  @Column()
  url: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field()
  @CreateDateColumn()
  uploadedAt: Date;
}
