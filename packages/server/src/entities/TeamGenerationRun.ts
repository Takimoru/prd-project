import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
@Entity()
export class TeamGenerationRun {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  programId: string;

  @Field({ nullable: true })
  @Column("simple-json", { nullable: true })
  parameters?: string; // JSON stringified

  @Field({ nullable: true })
  @Column("simple-json", { nullable: true })
  summary?: string; // JSON stringified

  @Field({ nullable: true })
  @Column({ nullable: true })
  generatedBy?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
