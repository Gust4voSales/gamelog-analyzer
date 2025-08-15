import { Controller, Get } from '@nestjs/common';
import { GetGlobalRankingService } from '@/app/services/player-stats/get-global-ranking.service';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly getGlobalRankingService: GetGlobalRankingService
  ) { }

  @Get('ranking')
  async getGlobalRanking() {
    const ranking = await this.getGlobalRankingService.execute();

    return { ranking };
  }
}
