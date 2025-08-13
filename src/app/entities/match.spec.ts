import { Match } from './match'
import { KillEvent, MatchEndEvent, MatchStartEvent, WorldKillEvent } from '../types/game-event.types'

describe('Match', () => {
  const mockDate = new Date('2024-01-01T10:00:00Z')
  const mockMatchId = 'test-match-123'

  const createMockMatchStartEvent = (): MatchStartEvent => ({
    type: 'MATCH_START',
    matchId: mockMatchId,
    time: mockDate,
  })

  const createMockMatchEndEvent = (matchId: string = mockMatchId): MatchEndEvent => ({
    type: 'MATCH_END',
    matchId,
    time: new Date('2024-01-01T10:30:00Z'),
  })

  const createMockKillEvent = (killer: string, victim: string, weapon: string): KillEvent => ({
    type: 'KILL',
    killer,
    victim,
    weapon,
    time: mockDate,
  })

  const createMockWorldKillEvent = (victim: string, cause: string): WorldKillEvent => ({
    type: 'WORLD_KILL',
    victim,
    cause,
    time: mockDate,
  })

  describe('createNewMatch', () => {
    it('should create a new match with correct initial values', () => {
      // Arrange
      const event = createMockMatchStartEvent()

      // Act
      const match = Match.createNewMatch(event)

      // Assert
      expect(match.id).toBe(mockMatchId)
      expect(match.startTime).toBe(mockDate)
      expect(match.endTime).toBeNull()
      expect(match.playerStats).toEqual([])
      expect(match.hasEnded).toBe(false)
    })
  })

  describe('endMatch', () => {
    let match: Match

    beforeEach(() => {
      const startEvent = createMockMatchStartEvent()
      match = Match.createNewMatch(startEvent)
    })

    it('should end match correctly with valid matchId', () => {
      // Arrange
      const endEvent = createMockMatchEndEvent()

      // Act
      match.endMatch(endEvent)

      // Assert
      expect(match.endTime).toBe(endEvent.time)
      expect(match.hasEnded).toBe(true)
    })

    it('should throw error when matchId does not match', () => {
      // Arrange
      const endEvent = createMockMatchEndEvent('different-match-id')

      // Act & Assert
      expect(() => match.endMatch(endEvent)).toThrow('Match ID mismatch: test-match-123 !== different-match-id')
    })
  })

  describe('addKillEvent', () => {
    let match: Match

    beforeEach(() => {
      const startEvent = createMockMatchStartEvent()
      match = Match.createNewMatch(startEvent)
    })

    it('should update kill and death stats correctly', () => {
      // Arrange
      const killEvent = createMockKillEvent('Player1', 'Player2', 'AK47')

      // Act
      match.addKillEvent(killEvent)

      // Assert
      const killer = match.playerStats.find(p => p.playerName === 'Player1')
      const victim = match.playerStats.find(p => p.playerName === 'Player2')

      expect(killer).toBeDefined()
      expect(victim).toBeDefined()
      expect(killer?.kills).toBe(1)
      expect(killer?.deaths).toBe(0)
      expect(victim?.kills).toBe(0)
      expect(victim?.deaths).toBe(1)
    })

    it('should track weapon usage correctly', () => {
      // Arrange
      const killEvent = createMockKillEvent('Player1', 'Player2', 'AK47')

      // Act
      match.addKillEvent(killEvent)

      // Assert
      const killer = match.playerStats.find(p => p.playerName === 'Player1')
      expect(killer?.weaponsUsed.get('AK47')).toBe(1)
    })

    it('should throw error when match has already ended', () => {
      // Arrange
      const killEvent = createMockKillEvent('Player1', 'Player2', 'AK47')
      const endEvent = createMockMatchEndEvent()
      match.endMatch(endEvent)

      // Act & Assert
      expect(() => match.addKillEvent(killEvent)).toThrow('Match has already ended')
    })
  })

  describe('addWorldKillEvent', () => {
    let match: Match

    beforeEach(() => {
      const startEvent = createMockMatchStartEvent()
      match = Match.createNewMatch(startEvent)
    })

    it('should handle world kill correctly', () => {
      // Arrange
      const worldKillEvent = createMockWorldKillEvent('Player1', 'fell')

      // Act
      match.addWorldKillEvent(worldKillEvent)

      // Assert
      const victim = match.playerStats.find(p => p.playerName === 'Player1')
      expect(victim).toBeDefined()
      expect(victim?.deaths).toBe(1)
      expect(victim?.kills).toBe(0)
    })

    it('should throw error when match has already ended', () => {
      // Arrange
      const worldKillEvent = createMockWorldKillEvent('Player1', 'fell')
      const endEvent = createMockMatchEndEvent()
      match.endMatch(endEvent)

      // Act & Assert
      expect(() => match.addWorldKillEvent(worldKillEvent)).toThrow('Match has already ended')
    })
  })
})
