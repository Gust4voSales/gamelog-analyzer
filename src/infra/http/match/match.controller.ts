import { Controller, Get, Param, Delete } from '@nestjs/common';
import { GetMatchRankingService } from '@/app/services/match/get-match-ranking.service';
import { DeleteAllMatchesService } from '@/app/services/match/delete-all-matches.service';

@Controller('matches')
export class MatchController {
  constructor(
    private readonly getMatchRankingService: GetMatchRankingService,
    private readonly deleteAllMatchesService: DeleteAllMatchesService
  ) { }

  @Get(':id/ranking')
  async getMatchRanking(@Param('id') matchId: string) {
    const output = await this.getMatchRankingService.execute(matchId);

    return { matchId: output.matchId, ranking: output.ranking, };
  }

  // 💀 
  // Dangerous method.
  // I created this method to help me test the application whenever I needed to upload a new log file I wouldn't need 
  // to change the ids of the matches from the log file. Just delete all previous matches with this method.
  // 💀
  @Delete()
  async deleteAllMatches() {
    await this.deleteAllMatchesService.execute();
    return { message: 'All matches deleted successfully' };
  }
}
