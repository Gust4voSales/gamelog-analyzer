import { MatchesLogsParser } from './matches-logs-parser'

describe('MatchesLogsParser', () => {
  let parser: MatchesLogsParser

  beforeEach(() => {
    parser = new MatchesLogsParser()
  })

  describe('Valid log processing', () => {
    it('should process multiple complete matches with various events and ignore empty lines', () => {
      // Arrange
      const logContent = `
  23/04/1999 15:00:00 - New match 1 has started

  23/04/1999 15:01:30 - Player1 killed Player2 using Shotgun
  23/04/1999 15:02:45 - Player3 killed Player1 using AK47

  23/04/1999 15:03:15 - <WORLD> killed Player2 by MOD_FALLING
  23/04/1999 15:04:22 - Player2 killed Player3 using Pistol
  23/04/1999 15:15:00 - Match 1 has ended

  24/04/1999 10:00:00 - New match 2 has started
  24/04/1999 10:01:15 - Player4 killed Player5 using Rifle
  24/04/1999 10:02:30 - <WORLD> killed Player4 by MOD_LAVA

  24/04/1999 10:15:00 - Match 2 has ended
  `

      // Act
      const result = parser.execute(logContent)

      // Assert
      expect(result.parseErrors).toEqual([])
      expect(result.matches).toHaveLength(2)

      // Validate first match
      const match1 = result.matches[0]
      expect(match1.id).toBe('1')
      expect(match1.startTime).toEqual(new Date('1999-04-23T15:00:00'))
      expect(match1.endTime).toEqual(new Date('1999-04-23T15:15:00'))
      expect(match1.hasEnded).toBe(true)
      expect(match1.playerStats).toHaveLength(3)

      // Validate player stats for match 1
      const player1Stats = match1.playerStats.find(p => p.playerName === 'Player1')
      const player2Stats = match1.playerStats.find(p => p.playerName === 'Player2')
      const player3Stats = match1.playerStats.find(p => p.playerName === 'Player3')

      expect(player1Stats?.kills).toBe(1)
      expect(player1Stats?.deaths).toBe(1)
      expect(player1Stats?.weaponsUsed.get('Shotgun')).toBe(1)

      expect(player2Stats?.kills).toBe(1)
      expect(player2Stats?.deaths).toBe(2) // killed by Player1 + world kill
      expect(player2Stats?.weaponsUsed.get('Pistol')).toBe(1)

      expect(player3Stats?.kills).toBe(1)
      expect(player3Stats?.deaths).toBe(1)
      expect(player3Stats?.weaponsUsed.get('AK47')).toBe(1)

      // Validate second match
      const match2 = result.matches[1]
      expect(match2.id).toBe('2')
      expect(match2.startTime).toEqual(new Date('1999-04-24T10:00:00'))
      expect(match2.endTime).toEqual(new Date('1999-04-24T10:15:00'))
      expect(match2.hasEnded).toBe(true)
      expect(match2.playerStats).toHaveLength(2)

      // Validate player stats for match 2
      const player4Stats = match2.playerStats.find(p => p.playerName === 'Player4')
      const player5Stats = match2.playerStats.find(p => p.playerName === 'Player5')

      expect(player4Stats?.kills).toBe(1)
      expect(player4Stats?.deaths).toBe(1) // world kill
      expect(player4Stats?.weaponsUsed.get('Rifle')).toBe(1)

      expect(player5Stats?.kills).toBe(0)
      expect(player5Stats?.deaths).toBe(1)
    })

    it('should process a single match with start and end only', () => {
      // Arrange
      const logContent = `23/04/1999 15:00:00 - New match simple-match has started
    23/04/1999 15:15:00 - Match simple-match has ended`

      // Act
      const result = parser.execute(logContent)

      // Assert
      expect(result.parseErrors).toEqual([])
      expect(result.matches).toHaveLength(1)

      const match = result.matches[0]
      expect(match.id).toBe('simple-match')
      expect(match.startTime).toEqual(new Date('1999-04-23T15:00:00'))
      expect(match.endTime).toEqual(new Date('1999-04-23T15:15:00'))
      expect(match.hasEnded).toBe(true)
      expect(match.playerStats).toHaveLength(0)
    })
  })

  describe('Error handling', () => {
    describe('Invalid input format', () => {
      it('should handle lines with invalid date format', () => {
        // Arrange
        const logContent = `invalid-date-format - New match 1 has started
23/04/1999 15:00:00 - New match 2 has started
23/04/1999 15:15:00 - Match 2 has ended`

        // Act
        const result = parser.execute(logContent)

        // Assert
        expect(result.parseErrors).toHaveLength(1)
        expect(result.parseErrors[0]).toBe('Line 1: Invalid date format')
        expect(result.matches).toHaveLength(1)
        expect(result.matches[0].id).toBe('2')
      })

      it('should handle unknown event types', () => {
        // Arrange
        const logContent = `23/04/1999 15:00:00 - New match 1 has started
23/04/1999 15:01:00 - Some unknown event happened
23/04/1999 15:15:00 - Match 1 has ended`

        // Act
        const result = parser.execute(logContent)

        // Assert
        expect(result.parseErrors).toHaveLength(1)
        expect(result.parseErrors[0]).toBe('Line 2: Unknown event type')
        expect(result.matches).toHaveLength(1)
        expect(result.matches[0].id).toBe('1')
      })
    })

    describe('Events without active match', () => {
      it('should handle kill event before match start', () => {
        // Arrange
        const logContent = `23/04/1999 15:00:00 - Player1 killed Player2 using Shotgun
23/04/1999 15:01:00 - New match 1 has started
23/04/1999 15:15:00 - Match 1 has ended`

        // Act
        const result = parser.execute(logContent)

        // Assert
        expect(result.parseErrors).toHaveLength(1)
        expect(result.parseErrors[0]).toBe("Line 1: Match not started before processing event 'KILL'")
        expect(result.matches).toHaveLength(1)
        expect(result.matches[0].id).toBe('1')
      })

      it('should handle world kill event before match start', () => {
        // Arrange
        const logContent = `23/04/1999 15:00:00 - <WORLD> killed Player1 by MOD_FALLING
23/04/1999 15:01:00 - New match 1 has started
23/04/1999 15:15:00 - Match 1 has ended`

        // Act
        const result = parser.execute(logContent)

        // Assert
        expect(result.parseErrors).toHaveLength(1)
        expect(result.parseErrors[0]).toBe("Line 1: Match not started before processing event 'WORLD_KILL'")
        expect(result.matches).toHaveLength(1)
        expect(result.matches[0].id).toBe('1')
      })

      it('should handle match end event without active match', () => {
        // Arrange
        const logContent = `23/04/1999 15:00:00 - Match test-match has ended`

        // Act
        const result = parser.execute(logContent)

        // Assert
        expect(result.parseErrors).toHaveLength(1)
        expect(result.parseErrors[0]).toBe("Line 1: Match not started before processing event 'MATCH_END'")
        expect(result.matches).toHaveLength(0)
      })
    })

    describe('Match state inconsistencies', () => {
      it('should not include incomplete matches in final result', () => {
        // Arrange
        const logContent = `23/04/1999 15:00:00 - New match incomplete-match has started
23/04/1999 15:01:00 - Player1 killed Player2 using Shotgun
24/04/1999 10:00:00 - New match complete-match has started
24/04/1999 10:15:00 - Match complete-match has ended`

        // Act
        const result = parser.execute(logContent)

        // Assert
        expect(result.matches).toHaveLength(0)
        expect(result.parseErrors).toHaveLength(2)
        expect(result.parseErrors[0]).toBe("Line 3: Match already started before processing event 'MATCH_START'")
        expect(result.parseErrors[1]).toBe("Line 4: Match ID mismatch: incomplete-match !== complete-match")
      })
    })
  })
})
