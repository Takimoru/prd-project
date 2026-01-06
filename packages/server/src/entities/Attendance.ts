import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm";
import { ObjectType, Field, ID, Float } from "type-graphql";
import { Team } from "./Team";
import { User } from "./User";

@ObjectType()
@Entity()
@Index(["teamId", "date"])
@Index(["userId", "date"])
export class Attendance {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  date: string; // YYYY-MM-DD

  @Field()
  @Column()
  status: string; // present, permission, alpha

  @Field()
  @CreateDateColumn()
  timestamp: Date;

  @Field()
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, team => team.attendance)
  team: Team;

  @Field()
  @Column()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.attendance)
  user: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  excuse?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  photoUrl?: string;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  long?: number;
}
