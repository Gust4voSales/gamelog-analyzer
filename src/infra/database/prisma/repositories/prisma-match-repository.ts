import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { MatchRepository } from "@/app/repositories/match-repository";
import { Match } from "@/app/entities/match";
import { MatchMapper } from "../mappers/match-mapper";
import { PlayerStatsMapper } from "../mappers/player-stats-mapper";
import { Prisma } from "@generated/prisma";
import { EntityAlreadyExistsError } from "@/infra/database/errors/entity-already-exists";

@Injectable()
export class PrismaMatchRepository implements MatchRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<Match | null> {
    const match = await this.prisma.match.findUnique({
      where: {
        id,
      },
      include: {
        playerStats: true,
      },
    });

    if (!match) {
      return null;
    }

    return MatchMapper.toDomain(match);
  }

  async createBatch(matches: Match[]): Promise<void> {
    let lastMatchId: string | null = null
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.match.createMany({
          data: matches.map(match => {
            lastMatchId = match.id
            return MatchMapper.toPrisma(match)
          }),
        });

        await tx.playerStats.createMany({
          data: matches.flatMap(match => match.playerStats.map(playerStat => PlayerStatsMapper.toPrisma(playerStat, match.id))),
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // https://www.prisma.io/docs/orm/reference/error-reference#p2002
        if (error.code === 'P2002' && lastMatchId) {
          throw new EntityAlreadyExistsError('Match', lastMatchId)
        }
      }
      throw error
    }
  }
}