import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Program } from "./Program";
import { Team } from "./Team";
import { Task } from "./Task";
import { Registration } from "./Registration";
import { Attendance } from "./Attendance";
import { Comment } from "./Comment";
import { WorkProgram } from "./WorkProgram";
import { WorkProgramProgress } from "./WorkProgramProgress";
import { Activity } from "./Activity";
import { WeeklyAttendanceApproval } from "./WeeklyAttendanceApproval";
import { TaskUpdate } from "./TaskUpdate";
import { WorkProgramMessage } from "./WorkProgramMessage";

@ObjectType()
@Entity()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  role: string; // admin, supervisor, student, pending

  @Field({ nullable: true })
  @Column({ nullable: true })
  studentId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  nidn?: string;

  @Field()
  @Column({ unique: true })
  googleId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  picture?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations

  @Field(() => [Program])
  @OneToMany(() => Program, program => program.creator)
  programsCreated: Program[];

  @Field(() => [Team])
  @OneToMany(() => Team, team => team.leader)
  teamsLed: Team[];

  @Field(() => [Team])
  @OneToMany(() => Team, team => team.supervisor)
  teamsSupervised: Team[];

  @Field(() => [Team])
  @ManyToMany(() => Team, team => team.members)
  teams: Team[];

  @Field(() => [Registration])
  @OneToMany(() => Registration, registration => registration.user)
  registrations: Registration[];

  @Field(() => [Registration])
  @OneToMany(() => Registration, registration => registration.reviewedBy)
  registrationsReviewed: Registration[];

  @Field(() => [Attendance])
  @OneToMany(() => Attendance, attendance => attendance.user)
  attendance: Attendance[];

  @Field(() => [Task])
  @OneToMany(() => Task, task => task.createdBy)
  tasksCreated: Task[];

  @Field(() => [Task])
  @ManyToMany(() => Task, task => task.assignedMembers)
  tasksAssigned: Task[];

  @Field(() => [Task])
  @OneToMany(() => Task, task => task.completedBy)
  tasksCompleted: Task[];

  @Field(() => [TaskUpdate])
  @OneToMany(() => TaskUpdate, update => update.user)
  taskUpdates: TaskUpdate[];

  @Field(() => [Comment])
  @OneToMany(() => Comment, comment => comment.author)
  comments: Comment[];

  @Field(() => [WorkProgram])
  @OneToMany(() => WorkProgram, wp => wp.createdBy)
  workProgramsCreated: WorkProgram[];

  @Field(() => [WorkProgram])
  @ManyToMany(() => WorkProgram, wp => wp.assignedMembers)
  workProgramsAssigned: WorkProgram[];

  @Field(() => [WorkProgramProgress])
  @OneToMany(() => WorkProgramProgress, wpp => wpp.member)
  workProgramProgress: WorkProgramProgress[];

  @Field(() => [Activity])
  @OneToMany(() => Activity, activity => activity.user)
  activities: Activity[];

  @Field(() => [WeeklyAttendanceApproval])
  @OneToMany(() => WeeklyAttendanceApproval, approval => approval.student)
  attendanceApprovalsAsStudent: WeeklyAttendanceApproval[];

  @Field(() => [WeeklyAttendanceApproval])
  @OneToMany(() => WeeklyAttendanceApproval, approval => approval.supervisor)
  attendanceApprovalsAsSupervisor: WeeklyAttendanceApproval[];

  @Field(() => [WorkProgramMessage])
  @OneToMany(() => WorkProgramMessage, message => message.sender)
  workProgramMessagesSent: WorkProgramMessage[];
}
