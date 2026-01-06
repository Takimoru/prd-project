import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class CreateSupervisorInput {
  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  nidn?: string;

  @Field({ nullable: true })
  password?: string;
}

@InputType()
export class UpdateSupervisorInput {
  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  nidn?: string;

  @Field({ nullable: true })
  password?: string;
}

