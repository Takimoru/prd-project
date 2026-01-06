import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany } from "typeorm";
import { ObjectType, Field, ID, Int } from "type-graphql";
import { Team } from "./Team";
import { Comment } from "./Comment";

@ObjectType()
@Entity()
export class WeeklyReport {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  week: string; // YYYY-WW

  @Field()
  @Column()
  status: string; // draft, submitted, approved, revision_requested

  @Field()
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, team => team.weeklyReports)
  team: Team;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => Int)
  @Column({ default: 0 })
  progressPercentage: number;

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  taskIds?: string[]; // Array of task IDs (matches Convex)

  @Field(() => [String], { nullable: true })
  @Column({ type: 'json', nullable: true })
  photos?: string[]; // Array of photo URLs (matches Convex)

  @Field(() => [Comment])
  @OneToMany(() => Comment, comment => comment.weeklyReport)
  comments: Comment[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  submittedAt?: Date;
}
