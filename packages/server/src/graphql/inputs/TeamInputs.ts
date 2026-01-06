import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class CreateTeamInput {
  @Field(() => ID)
  programId: string;

  @Field(() => ID)
  leaderId: string;

  @Field(() => [ID])
  memberIds: string[];

  @Field(() => ID, { nullable: true })
  supervisorId?: string;

  @Field({ nullable: true })
  name?: string;
}

@InputType()
export class UpdateTeamInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => ID, { nullable: true })
  leaderId?: string;

  @Field(() => [ID], { nullable: true })
  memberIds?: string[];

  @Field(() => ID, { nullable: true })
  supervisorId?: string;

  @Field(() => Number, { nullable: true })
  progress?: number;
}

@InputType()
export class AddMemberInput {
  @Field(() => ID)
  teamId: string;

  @Field(() => ID)
  userId: string;
}

