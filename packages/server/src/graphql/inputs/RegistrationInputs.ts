import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class SubmitRegistrationInput {
  @Field(() => ID)
  programId: string;

  @Field()
  fullName: string;

  @Field()
  studentId: string;

  @Field()
  phone: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  paymentProofUrl?: string;
}

