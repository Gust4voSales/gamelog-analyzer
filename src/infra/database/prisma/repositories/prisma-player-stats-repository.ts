import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PlayerStatsRepository } from "@/app/repositories/player-stats-repository";
import { PlayerStat } from "@/app/entities/player-stat";

@Injectable()
export class PrismaPlayerStatsRepository implements PlayerStatsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async getGlobalRanking(): Promise<PlayerStat[]> {
    // Get aggregated player statistics grouped by player name
    const playerStatsAggregation = await this.prisma.playerStats.groupBy({
      by: ['playerName'],
      _sum: {
        kills: true,
        deaths: true,
      },
      _max: {
        bestStreak: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          kills: 'desc',
        },
      },
    });

    return playerStatsAggregation.map(aggregation => {
      const playerName = aggregation.playerName;

      return PlayerStat.create({
        playerName,
        totalKills: aggregation._sum.kills || 0,
        totalDeaths: aggregation._sum.deaths || 0,
        bestStreak: aggregation._max.bestStreak || 0,
        matchesPlayed: aggregation._count.id,
      });
    });
  }
}
