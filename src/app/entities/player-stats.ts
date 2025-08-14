import { BaseEntity } from "./base-entity"

interface PlayerStatsProps {
  playerName: string
  kills: number
  deaths: number
  weaponsUsed: Map<string, number>
  bestStreak: number
}

export class PlayerStats extends BaseEntity<PlayerStatsProps> {
  private currentKillStreak: number = 0

  private constructor(props: PlayerStatsProps) {
    super(props)
  }

  static createNewPlayerStats(playerName: string): PlayerStats {
    return new PlayerStats({
      playerName,
      kills: 0,
      deaths: 0,
      weaponsUsed: new Map(),
      bestStreak: 0,
    })
  }
  static create(props: PlayerStatsProps): PlayerStats {
    return new PlayerStats(props)
  }

  // ====================================================================
  // getters

  get playerName() {
    return this.props.playerName
  }

  get kills() {
    return this.props.kills
  }

  get deaths() {
    return this.props.deaths
  }

  get weaponsUsed() {
    return this.props.weaponsUsed
  }

  get bestStreak() {
    return this.props.bestStreak
  }

  get KDA() {
    return this.props.deaths === 0 ? this.props.kills : Number((this.props.kills / this.props.deaths).toFixed(2))
  }

  // ====================================================================
  // public methods

  public reportStats() {
    return {
      playerName: this.props.playerName,
      kills: this.props.kills,
      deaths: this.props.deaths,
      KDA: this.KDA,
      bestStreak: this.props.bestStreak,
      weaponsUsed: Object.fromEntries(this.props.weaponsUsed.entries())
    }
  }

  public addKill(weapon: string) {
    this.props.kills++
    this.props.weaponsUsed.set(weapon, (this.props.weaponsUsed.get(weapon) ?? 0) + 1)
    this.currentKillStreak++
    this.props.bestStreak = Math.max(this.props.bestStreak, this.currentKillStreak)
  }

  public addDeath() {
    this.props.deaths++
    this.currentKillStreak = 0
  }
}