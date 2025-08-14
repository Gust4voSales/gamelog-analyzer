import { Injectable } from '@nestjs/common';
import { MatchRepository } from '../../repositories/match-repository';
import { EntityNotFoundError } from '@/app/errors/entity-not-found';

export interface PlayerRanking {
  position: number;
  playerName: string;
  kills: number;
  deaths: number;
  KDA: number;
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
      .map(player => ({
        playerName: player.playerName,
        kills: player.kills,
        deaths: player.deaths,
        KDA: player.deaths === 0 ? player.kills : Number((player.kills / player.deaths).toFixed(2))
      }))
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
