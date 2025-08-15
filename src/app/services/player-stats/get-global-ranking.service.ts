import { Injectable } from '@nestjs/common';
import { PlayerStatsRepository } from '@/app/repositories/player-stats-repository';


@Injectable()
export class GetGlobalRankingService {
  constructor(private readonly playerStatsRepository: PlayerStatsRepository) { }

  async execute() {
    const playerStats = await this.playerStatsRepository.getGlobalRanking();

    // Convert PlayerStat entities to GlobalPlayerRanking format and apply additional sorting
    const ranking = playerStats
      .map(playerStat => playerStat.toGlobalRanking())
      .sort((a, b) => {
        // Sort by KDA (desc), then by kills (desc) as tiebreaker
        if (b.overallKDA !== a.overallKDA) {
          return b.overallKDA - a.overallKDA;
        }
        return b.totalKills - a.totalKills;
      });

    return ranking
  }
}
