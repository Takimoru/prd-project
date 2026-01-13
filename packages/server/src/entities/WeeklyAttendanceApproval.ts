import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, Index } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Team } from "./Team";
import { User } from "./User";

@ObjectType()
@Entity()
@Unique(["teamId", "weekStartDate", "studentId"])
@Index(["teamId", "weekStartDate"])
@Index(["supervisorId", "status"])
export class WeeklyAttendanceApproval {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, team => team.attendanceApprovals, { onDelete: 'CASCADE' })
  team: Team;

  @Field()
  @Column()
  weekStartDate: string; // YYYY-MM-DD (Monday)

  @Field()
  @Column()
  studentId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.attendanceApprovalsAsStudent)
  student: User;

  @Field()
  @Column()
  supervisorId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.attendanceApprovalsAsSupervisor)
  supervisor: User;

  @Field()
  @Column()
  status: string; // pending, approved, rejected

  @Field({ nullable: true })
  @Column({ nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  notes?: string;
}
