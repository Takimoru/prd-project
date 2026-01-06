import { InputType, Field } from 'type-graphql';

@InputType()
export class CreateProgramInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  startDate: string; // ISO date string

  @Field()
  endDate: string; // ISO date string
}

@InputType()
export class UpdateProgramInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  startDate?: string;

  @Field({ nullable: true })
  endDate?: string;
}

