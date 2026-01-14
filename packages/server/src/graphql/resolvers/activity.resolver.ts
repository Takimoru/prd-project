import { Resolver, Query, Arg, ID, Ctx } from 'type-graphql';
import { Activity } from '../../entities/Activity';
import { User } from '../../entities/User';
import { Team } from '../../entities/Team';
import { Context } from '../context';
import { AppDataSource } from '../../data-source';
import { requireAuth } from '../../lib/auth-helpers';
import { In } from 'typeorm';

@Resolver(() => Activity)
export class ActivityResolver {
  @Query(() => [Activity])
  async activities(
    @Arg('teamId', () => ID, { nullable: true }) teamId: string | null,
    @Ctx() ctx: Context
  ): Promise<Activity[]> {
    requireAuth(ctx);

    const activityRepo = AppDataSource.getRepository(Activity);
    const teamRepo = AppDataSource.getRepository(Team);
    
    let filterTeamIds: string[] = [];

    if (teamId) {
      filterTeamIds = [teamId];
    } else {
      // Fetch all teams connected to the user
      const userTeams = await teamRepo
        .createQueryBuilder('team')
        .where('team.leaderId = :userId', { userId: ctx.userId })
        .orWhere('team.supervisorId = :userId', { userId: ctx.userId })
        .orWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('t.id')
            .from(Team, 't')
            .innerJoin('t.members', 'm', 'm.id = :userId', { userId: ctx.userId })
            .getQuery();
          return `team.id IN ${subQuery}`;
        })
        .getMany();

      filterTeamIds = userTeams.map(t => t.id);
    }

    if (filterTeamIds.length === 0) {
      return [];
    }

    const activities = await activityRepo.find({
      where: { teamId: In(filterTeamIds) },
      relations: ['user', 'team'],
      order: { timestamp: 'DESC' },
      take: 10,
    });

    return activities;
  }
}

