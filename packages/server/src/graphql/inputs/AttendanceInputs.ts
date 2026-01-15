import { InputType, Field, ID, Float } from 'type-graphql';

@InputType()
export class CheckInInput {
  @Field(() => ID)
  teamId: string;

  @Field()
  date: string; // YYYY-MM-DD

  @Field()
  status: string; // present, permission, alpha

  @Field({ nullable: true })
  excuse?: string;

  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  long?: number;

  @Field({ nullable: true })
  photoUrl?: string;

  @Field({ nullable: true })
  proofUrl?: string;
}

