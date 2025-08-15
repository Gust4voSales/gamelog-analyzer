import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { MatchRepository } from "../../app/repositories/match-repository";
import { PrismaMatchRepository } from "./prisma/repositories/prisma-match-repository";
import { PlayerStatsRepository } from "../../app/repositories/player-stats-repository";
import { PrismaPlayerStatsRepository } from "./prisma/repositories/prisma-player-stats-repository";

@Module({
  providers: [
    PrismaService,
    {
      provide: MatchRepository,
      useClass: PrismaMatchRepository,
    },
    {
      provide: PlayerStatsRepository,
      useClass: PrismaPlayerStatsRepository,
    },
  ],
  exports: [
    MatchRepository,
    PlayerStatsRepository,
  ]
})
export class DatabaseModule { }