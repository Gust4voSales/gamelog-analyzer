import { Prisma } from "@generated/prisma";
import { Match } from "@/app/entities/match";
import { PlayerStatsMapper } from "./player-stats-mapper";

type PrismaMatchWithPlayerStats = Prisma.MatchGetPayload<{
  include: {
    playerStats: true,
  }
}>

export class MatchMapper {
  static toDomain(raw: PrismaMatchWithPlayerStats): Match {
    return Match.create({
      id: raw.id,
      startTime: raw.startTime,
      endTime: raw.endTime,
      playerStats: raw.playerStats.map(playerStat => PlayerStatsMapper.toDomain(playerStat)),
    });
  }

  static toPrisma(match: Match): Prisma.MatchCreateManyInput {
    return {
      id: match.id,
      startTime: match.startTime,
      endTime: match.endTime ?? new Date(),
    }
  }
}