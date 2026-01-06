import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { ObjectType, Field, ID, Int } from "type-graphql";
import { Program } from "./Program";
import { User } from "./User";
import { Task } from "./Task";
import { Attendance } from "./Attendance";
import { WeeklyReport } from "./WeeklyReport";
import { WorkProgram } from "./WorkProgram";
import { Activity } from "./Activity";
import { WeeklyAttendanceApproval } from "./WeeklyAttendanceApproval";

@ObjectType()
export class DocumentationItem {
  @Field()
  name: string;
  
  @Field()
  url: string;
  
  @Field()
  type: string;
  
  @Field()
  uploadedAt: string;
}

@ObjectType()
@Entity()
export class Team {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field()
  @Column()
  programId: string;

  @Field(() => Program)
  @ManyToOne(() => Program, program => program.teams)
  program: Program;

  @Field()
  @Column()
  leaderId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.teamsLed)
  leader: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  supervisorId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, user => user.teamsSupervised, { nullable: true })
  supervisor?: User;

  @Field(() => [User])
  @ManyToMany(() => User, user => user.teams)
  @JoinTable()
  members: User[];

  @Field(() => Int)
  @Column({ default: 0 })
  progress: number;

  @Field(() => [Task])
  @OneToMany(() => Task, task => task.team)
  tasks: Task[];

  @Field(() => [Attendance])
  @OneToMany(() => Attendance, attendance => attendance.team)
  attendance: Attendance[];

  @Field(() => [WeeklyReport])
  @OneToMany(() => WeeklyReport, report => report.team)
  weeklyReports: WeeklyReport[];

  @Field(() => [WorkProgram])
  @OneToMany(() => WorkProgram, wp => wp.team)
  workPrograms: WorkProgram[];

  @Field(() => [Activity])
  @OneToMany(() => Activity, activity => activity.team)
  activities: Activity[];

  @Field(() => [WeeklyAttendanceApproval])
  @OneToMany(() => WeeklyAttendanceApproval, approval => approval.team)
  attendanceApprovals: WeeklyAttendanceApproval[];

  @Field(() => [DocumentationItem], { nullable: true })
  @Column("simple-json", { nullable: true })
  documentation?: DocumentationItem[];
}
