import { Controller, Get, Param } from '@nestjs/common';
import { GetMatchRankingService } from '@/app/services/match/get-match-ranking.service';

@Controller('matches')
export class MatchController {
  constructor(private readonly getMatchRankingService: GetMatchRankingService) { }

  @Get(':id/ranking')
  async getMatchRanking(@Param('id') matchId: string) {
    const output = await this.getMatchRankingService.execute(matchId);

    return { matchId: output.matchId, ranking: output.ranking, };
  }
}
