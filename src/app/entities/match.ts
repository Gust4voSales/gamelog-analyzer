import { KillEvent, MatchEndEvent, MatchStartEvent, WorldKillEvent } from "../types/game-event.types"
import { BaseEntity } from "./base-entity"
import { PlayerStats } from "./player-stats"

interface MatchProps {
  id: string
  startTime: Date
  endTime: Date | null
  playerStats: PlayerStats[]
}

export class Match extends BaseEntity<MatchProps> {
  private constructor(props: MatchProps) {
    super(props)
  }

  static createNewMatch(event: MatchStartEvent): Match {
    return new Match({
      id: event.matchId,
      startTime: event.time,
      endTime: null,
      playerStats: [],
    })
  }

  // ====================================================================
  // getters

  get hasEnded() {
    return this.props.endTime !== null
  }

  get id() {
    return this.props.id
  }

  get playerStats() {
    return this.props.playerStats
  }

  get startTime() {
    return this.props.startTime
  }

  get endTime() {
    return this.props.endTime
  }

  // ====================================================================
  // private methods

  private validateMatchHasNotEnded() {
    if (this.hasEnded) {
      throw new Error('Match has already ended')
    }
  }

  private getOrCreatePlayerStats(playerName: string): PlayerStats {
    let playerStats = this.props.playerStats.find(player => player.playerName === playerName)
    if (!playerStats) {
      playerStats = PlayerStats.createNewPlayerStats(playerName)
      this.props.playerStats.push(playerStats)
    }

    return playerStats
  }

  // ====================================================================
  // public methods

  public endMatch(event: MatchEndEvent) {
    if (this.id !== event.matchId) {
      throw new Error(`Match ID mismatch: ${this.id} !== ${event.matchId}`)
    }

    this.props.endTime = event.time
  }

  public addKillEvent(event: KillEvent) {
    this.validateMatchHasNotEnded()

    const killer = this.getOrCreatePlayerStats(event.killer)
    const victim = this.getOrCreatePlayerStats(event.victim)

    killer.addKill(event.weapon)
    victim.addDeath()
  }

  public addWorldKillEvent(event: WorldKillEvent) {
    this.validateMatchHasNotEnded()

    const victim = this.getOrCreatePlayerStats(event.victim)

    victim.addDeath()
  }
}