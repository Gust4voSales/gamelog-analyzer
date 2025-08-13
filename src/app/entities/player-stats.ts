import { BaseEntity } from "./base-entity"

interface PlayerStatsProps {
  playerName: string
  kills: number
  deaths: number
  weaponsUsed: Map<string, number>
  bestStreak: number
  // awards: Award[] // TODO enum
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

  // ====================================================================
  // public methods

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