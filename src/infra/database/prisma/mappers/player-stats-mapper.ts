import { Prisma, PlayerStats as PrismaPlayerStats } from "@generated/prisma";
import { PlayerStats } from "@/app/entities/player-stats";

type PrismaWeaponStatsJson = {
  weaponName: string;
  killCount: number;
}

export class PlayerStatsMapper {
  static toDomain(raw: PrismaPlayerStats): PlayerStats {
    const weaponsUsed = new Map(
      Object.entries(raw.weaponStats as Prisma.JsonObject)
        .map(([weaponName, killCount]) => [weaponName, killCount as number])
    )

    return PlayerStats.create({
      playerName: raw.playerName,
      kills: raw.kills,
      deaths: raw.deaths,
      weaponsUsed,
      bestStreak: raw.bestStreak,
    })
  }

  static toPrisma(playerStats: PlayerStats, matchId: string): Prisma.PlayerStatsCreateManyInput {
    return {
      playerName: playerStats.playerName,
      kills: playerStats.kills,
      deaths: playerStats.deaths,
      bestStreak: playerStats.bestStreak,
      weaponStats: Object.fromEntries(playerStats.weaponsUsed.entries()),
      matchId,
    }
  }
}
