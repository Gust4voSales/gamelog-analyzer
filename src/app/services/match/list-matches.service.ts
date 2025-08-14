import { Injectable } from '@nestjs/common';
import { MatchRepository } from '@/app/repositories/match-repository';

export interface ListMatchesOutput {
  id: string;
  startTime: Date;
  endTime: Date | null;
  players: {
    name: string;
  }[];
}

@Injectable()
export class ListMatchesService {
  constructor(private readonly matchRepository: MatchRepository) { }

  async execute(): Promise<ListMatchesOutput[]> {
    const matches = await this.matchRepository.findAll();

    return matches.map(match => ({
      id: match.id,
      startTime: match.startTime,
      endTime: match.endTime,
      players: match.playerStats.map(playerStat => ({
        name: playerStat.playerName,
      })),
    }));
  }
}
