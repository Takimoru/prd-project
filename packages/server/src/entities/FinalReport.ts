import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ObjectType, Field, ID, registerEnumType } from "type-graphql";
import { Team } from "./Team";
import { User } from "./User";

export enum FinalReportStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REVISION_REQUESTED = "revision_requested"
}

registerEnumType(FinalReportStatus, {
  name: "FinalReportStatus",
  description: "Status of final report"
});

@ObjectType()
@Entity()
export class FinalReport {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  team: Team;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  fileUrl: string;

  @Field()
  @Column()
  fileName: string;

  @Field(() => FinalReportStatus)
  @Column({ type: "varchar", default: FinalReportStatus.PENDING })
  status: FinalReportStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewNotes?: string;

  @Field()
  @Column()
  uploadedById: string;

  @Field(() => User)
  @ManyToOne(() => User)
  uploadedBy: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewedById?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  reviewedBy?: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewedAt?: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
