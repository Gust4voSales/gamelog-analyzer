import { PlayerStat } from "@/app/entities/player-stat";

export abstract class PlayerStatsRepository {
  abstract getGlobalRanking(): Promise<PlayerStat[]>;
}
