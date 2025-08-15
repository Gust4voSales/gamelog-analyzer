import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { GetGlobalRankingService } from '@/app/services/player-stats/get-global-ranking.service';
import { DatabaseModule } from '@/infra/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PlayersController],
  providers: [GetGlobalRankingService],
})
export class PlayersModule { }
