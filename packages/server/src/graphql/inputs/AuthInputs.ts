import { InputType, Field } from 'type-graphql';

@InputType()
export class CreateOrUpdateUserInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  googleId: string;

  @Field({ nullable: true })
  picture?: string;

  @Field({ nullable: true })
  role?: string;

  @Field({ nullable: true })
  studentId?: string;
}

