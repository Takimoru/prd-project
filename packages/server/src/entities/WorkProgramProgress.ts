import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, Unique, Index } from "typeorm";
import { ObjectType, Field, ID, Int } from "type-graphql";
import { WorkProgram } from "./WorkProgram";
import { User } from "./User";

@ObjectType()
@Entity()
@Unique(["workProgramId", "memberId"])
@Index(["workProgramId"])
@Index(["memberId"])
export class WorkProgramProgress {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  workProgramId: string;

  @Field(() => WorkProgram)
  @ManyToOne(() => WorkProgram, wp => wp.progress)
  workProgram: WorkProgram;

  @Field()
  @Column()
  memberId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.workProgramProgress)
  member: User;

  @Field(() => Int)
  @Column({ default: 0 })
  percentage: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes?: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
