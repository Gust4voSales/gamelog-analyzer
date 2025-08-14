import { Injectable } from '@nestjs/common';
import { MatchRepository } from '../../repositories/match-repository';
import { EntityNotFoundError } from '@/app/errors/entity-not-found';
import { PlayerStats } from '@/app/entities/player-stats';

export interface PlayerRanking extends ReturnType<typeof PlayerStats.prototype.reportStats> {
  position: number
}

export interface MatchRankingResponse {
  matchId: string;
  ranking: PlayerRanking[];
}

@Injectable()
export class GetMatchRankingService {
  constructor(private readonly matchRepository: MatchRepository) { }

  async execute(matchId: string): Promise<MatchRankingResponse> {
    const match = await this.matchRepository.findById(matchId);

    if (!match) {
      throw new EntityNotFoundError('Match', matchId);
    }

    const sortedPlayers = match.playerStats
      .map(player => player.reportStats())
      .sort((a, b) => {
        if (b.kills !== a.kills) {
          return b.kills - a.kills;
        }
        // Tiebreaker: deaths, fewer deaths are better
        return a.deaths - b.deaths;
      });

    // Add position to each player
    const ranking: PlayerRanking[] = sortedPlayers.map((player, index) => ({
      position: index + 1,
      ...player
    }));

    return {
      matchId: match.id,
      ranking
    };
  }
}
