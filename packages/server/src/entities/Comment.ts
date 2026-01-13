import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";
import { WeeklyReport } from "./WeeklyReport";

@ObjectType()
@Entity()
export class Comment {
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
  authorId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.comments)
  author: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  weeklyReportId?: string;

  @Field(() => WeeklyReport, { nullable: true })
  @ManyToOne(() => WeeklyReport, report => report.comments, { nullable: true, onDelete: 'CASCADE' })
  weeklyReport?: WeeklyReport;
}
