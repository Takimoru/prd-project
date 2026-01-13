import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Team } from "./Team";
import { User } from "./User";

@ObjectType()
@Entity()
export class Logsheet {
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
  weekNumber: string; // YYYY-WW

  @Field()
  @Column()
  fileUrl: string;

  @Field()
  @Column()
  createdById: string;

  @Field(() => User)
  @ManyToOne(() => User)
  createdBy: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
