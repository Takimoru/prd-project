import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Program } from "./Program";
import { User } from "./User";

@ObjectType()
@Entity()
@Index(["programId"])
@Index(["status"])
@Index(["email"])
export class Registration {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  status: string; // pending, approved, rejected

  @Field()
  @Column()
  programId: string;

  @Field(() => Program)
  @ManyToOne(() => Program, program => program.registrations)
  program: Program;

  @Field({ nullable: true })
  @Column({ nullable: true })
  userId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, user => user.registrations, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewedById?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, user => user.registrationsReviewed, { nullable: true })
  reviewedBy?: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  studentId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  paymentProofUrl?: string;

  @Field()
  @CreateDateColumn()
  submittedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewNotes?: string;
}
