import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Team } from "./Team";
import { User } from "./User";

@ObjectType()
@Entity()
@Index(["teamId"])
@Index(["teamId", "timestamp"])
export class Activity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  teamId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, team => team.activities)
  team: Team;

  @Field()
  @Column()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.activities)
  user: User;

  @Field()
  @Column()
  action: string; // created_task, updated_task, completed_task, created_program, uploaded_file

  @Field()
  @Column()
  targetId: string;

  @Field()
  @Column()
  targetTitle: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  details?: string;

  @Field()
  @CreateDateColumn()
  timestamp: Date;
}
