import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";
import { WorkProgram } from "./WorkProgram";

@ObjectType()
@Entity()
export class WorkProgramMessage {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  content: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @Column()
  senderId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.workProgramMessagesSent)
  sender: User;

  @Field()
  @Column()
  workProgramId: string;

  @Field(() => WorkProgram)
  @ManyToOne(() => WorkProgram, wp => wp.messages, { onDelete: 'CASCADE' })
  workProgram: WorkProgram;
}
