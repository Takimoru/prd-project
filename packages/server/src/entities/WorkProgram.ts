import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, CreateDateColumn } from "typeorm";
import { ObjectType, Field, ID, Int } from "type-graphql";
import { Team } from "./Team";
import { User } from "./User";
import { Task } from "./Task";
import { WorkProgramProgress } from "./WorkProgramProgress";

@ObjectType()
@Entity()
export class WorkProgram {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, team => team.workPrograms, { onDelete: 'CASCADE' })
  team: Team;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Column()
  startDate: Date;

  @Field()
  @Column()
  endDate: Date;

  @Field()
  @Column()
  createdById: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.workProgramsCreated)
  createdBy: User;

  @Field(() => [User])
  @ManyToMany(() => User, user => user.workProgramsAssigned)
  @JoinTable()
  assignedMembers: User[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  // No direct relation to Task in previous schema, but implied 'workProgramId' on Task
  // Let's assume Task has workProgramId
  @Field(() => [Task])
  @OneToMany("Task", "workProgram") // Indirect string ref to avoid circ dependency issues if strictly typed
  tasks: any[]; // Using any[] temporarily or use Thunk if needed, but 'Task' type handles it well in Type-GraphQL usually

  @Field(() => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  progress: number;

  @Field(() => [WorkProgramProgress])
  @OneToMany(() => WorkProgramProgress, progress => progress.workProgram)
  progressRecords: WorkProgramProgress[];
}
