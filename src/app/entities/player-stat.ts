import { BaseEntity } from "./base-entity";

interface PlayerStatProps {
  playerName: string;
  totalKills: number;
  totalDeaths: number;
  bestStreak: number;
  matchesPlayed: number;
}

export class PlayerStat extends BaseEntity<PlayerStatProps> {
  private constructor(props: PlayerStatProps) {
    super(props);
  }

  static create(props: PlayerStatProps): PlayerStat {
    return new PlayerStat(props);
  }

  // ====================================================================
  // getters

  get playerName() {
    return this.props.playerName;
  }

  get totalKills() {
    return this.props.totalKills;
  }

  get totalDeaths() {
    return this.props.totalDeaths;
  }

  get bestStreak() {
    return this.props.bestStreak;
  }

  get matchesPlayed() {
    return this.props.matchesPlayed;
  }

  get overallKDA() {
    return this.props.totalDeaths === 0
      ? this.props.totalKills
      : Number((this.props.totalKills / this.props.totalDeaths).toFixed(2));
  }

  // ====================================================================
  // public methods

  public toGlobalRanking() {
    return {
      playerName: this.props.playerName,
      totalKills: this.props.totalKills,
      totalDeaths: this.props.totalDeaths,
      overallKDA: this.overallKDA,
      bestStreak: this.props.bestStreak,
      matchesPlayed: this.props.matchesPlayed,
    };
  }
}
