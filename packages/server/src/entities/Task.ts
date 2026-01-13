import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, CreateDateColumn, JoinTable } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Team } from "./Team";
import { User } from "./User";
import { TaskUpdate } from "./TaskUpdate";
import { TaskFile } from "./TaskFile";

@ObjectType()
@Entity()
export class Task {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column({ default: "todo" })
  status: string;

  @Field()
  @Column({ default: false })
  completed: boolean;

  @Field()
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, team => team.tasks, { onDelete: 'CASCADE' })
  team: Team;

  @Field()
  @Column()
  createdById: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.tasksCreated)
  createdBy: User;

  @Field(() => [User])
  @ManyToMany(() => User, user => user.tasksAssigned)
  @JoinTable()
  assignedMembers: User[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  startTime?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  endTime?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  workProgramId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  completedById?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, user => user.tasksCompleted, { nullable: true })
  completedBy?: User;

  @Field(() => [TaskUpdate])
  @OneToMany(() => TaskUpdate, update => update.task)
  updates: TaskUpdate[];

  @Field(() => [TaskFile])
  @OneToMany(() => TaskFile, file => file.task)
  completionFiles: TaskFile[];
}
