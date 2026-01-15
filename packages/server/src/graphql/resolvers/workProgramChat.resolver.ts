import { Resolver, Query, Mutation, Arg, ID, Ctx, FieldResolver, Root, Subscription, PubSub, PubSubEngine } from 'type-graphql';
import { WorkProgramMessage } from '../../entities/WorkProgramMessage';
import { WorkProgram } from '../../entities/WorkProgram';
import { User } from '../../entities/User';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';
import { requireAuth } from '../../lib/auth-helpers';

@Resolver(() => WorkProgramMessage)
export class WorkProgramChatResolver {
  @FieldResolver(() => User)
  async sender(@Root() message: WorkProgramMessage): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);
    return await userRepo.findOneOrFail({ where: { id: message.senderId } });
  }

  @Query(() => [WorkProgramMessage])
  async workProgramMessages(
    @Arg('workProgramId', () => ID) workProgramId: string,
    @Ctx() ctx: Context
  ): Promise<WorkProgramMessage[]> {
    requireAuth(ctx);
    const messageRepo = AppDataSource.getRepository(WorkProgramMessage);
    return await messageRepo.find({
      where: { workProgramId },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });
  }

  @Mutation(() => WorkProgramMessage)
  async sendWorkProgramMessage(
    @Arg('workProgramId', () => ID) workProgramId: string,
    @Arg('content') content: string,
    @Ctx() ctx: Context
  ): Promise<WorkProgramMessage> {
    requireAuth(ctx);
    
    const userRepo = AppDataSource.getRepository(User);
    const wpRepo = AppDataSource.getRepository(WorkProgram);
    const messageRepo = AppDataSource.getRepository(WorkProgramMessage);

    const user = ctx.userEmail
      ? await userRepo.findOne({ where: { email: ctx.userEmail } })
      : ctx.userId
      ? await userRepo.findOne({ where: { id: ctx.userId } })
      : null;

    if (!user) throw new Error('User not found');

    const wp = await wpRepo.findOne({ where: { id: workProgramId } });
    if (!wp) throw new Error('Work program not found');

    const message = messageRepo.create({
      workProgramId,
      content,
      senderId: user.id,
    });

    const saved = await messageRepo.save(message);
    const result = await messageRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ['sender', 'workProgram'],
    });

    await ctx.pubSub.publish('WORK_PROGRAM_MESSAGE_ADDED', result);

    return result;
  }

  @Subscription(() => WorkProgramMessage, {
    topics: 'WORK_PROGRAM_MESSAGE_ADDED',
    filter: ({ payload, args }) => payload.workProgramId === args.workProgramId,
  })
  workProgramMessageAdded(
    @Root() payload: WorkProgramMessage,
    @Arg('workProgramId', () => ID) workProgramId: string
  ): WorkProgramMessage {
    return payload;
  }
}
