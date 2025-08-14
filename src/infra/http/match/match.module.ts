import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { GetMatchRankingService } from '@/app/services/match/get-match-ranking.service';
import { DatabaseModule } from '@/infra/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MatchController],
  providers: [GetMatchRankingService],
})
export class MatchModule { }
