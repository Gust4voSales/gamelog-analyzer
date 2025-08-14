import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { MatchRepository } from "../../app/repositories/match-repository";
import { PrismaMatchRepository } from "./prisma/repositories/prisma-match-repository";

@Module({
  providers: [
    PrismaService,
    {
      provide: MatchRepository,
      useClass: PrismaMatchRepository,
    },
  ],
  exports: [
    MatchRepository,
  ]
})
export class DatabaseModule { }