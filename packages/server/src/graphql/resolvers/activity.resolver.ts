import { Resolver, Query, Arg, ID, Ctx } from 'type-graphql';
import { Activity } from '../../entities/Activity';
import { User } from '../../entities/User';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';
import { requireAuth } from '../../lib/auth-helpers';

/**
 * Activity Resolver - Timeline/Recent Activity
 * Matches Convex behavior: api.activities.get
 */
@Resolver(() => Activity)
export class ActivityResolver {
  @Query(() => [Activity])
  async activities(
    @Arg('teamId', () => ID) teamId: string,
    @Ctx() ctx: Context
  ): Promise<Activity[]> {
    requireAuth(ctx);

    const activityRepo = AppDataSource.getRepository(Activity);
    
    // Match Convex behavior: query by team, order DESC, take 10
    const activities = await activityRepo.find({
      where: { teamId },
      relations: ['user', 'team'],
      order: { timestamp: 'DESC' },
      take: 10,
    });

    // Convex enriches with userName and userPicture
    // Our entity already has user relation, so GraphQL will resolve it
    // But we can add field resolvers if needed for exact match
    
    return activities;
  }
}

