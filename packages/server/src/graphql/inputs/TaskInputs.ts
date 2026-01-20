import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class CreateTaskInput {
  @Field(() => ID)
  teamId: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [ID])
  assignedMemberIds: string[];

  @Field({ nullable: true })
  startTime?: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field(() => ID, { nullable: true })
  workProgramId?: string;
}

@InputType()
export class TaskFileInput {
  @Field()
  url: string;

  @Field({ nullable: true })
  name?: string;
}

@InputType()
export class UpdateTaskInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [ID], { nullable: true })
  assignedMemberIds?: string[];

  @Field({ nullable: true })
  startTime?: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field({ nullable: true })
  completed?: boolean;

  @Field(() => [TaskFileInput], { nullable: true })
  completionFiles?: TaskFileInput[];
}

