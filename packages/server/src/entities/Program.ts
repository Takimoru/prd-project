import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";
import { Team } from "./Team";
import { Registration } from "./Registration";

@ObjectType()
@Entity()
export class Program {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

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
  @Column({ default: false })
  archived: boolean;

  @Field()
  @Column()
  createdBy: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, user => user.programsCreated, { nullable: true })
  creator: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Team])
  @OneToMany(() => Team, team => team.program)
  teams: Team[];

  @Field(() => [Registration])
  @OneToMany(() => Registration, reg => reg.program)
  registrations: Registration[];
}
