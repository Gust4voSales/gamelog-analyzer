import { PlayerStats } from './player-stats'

describe('PlayerStats', () => {
  describe('createNewPlayer', () => {
    it('should create a new player with correct initial values', () => {
      // Arrange
      const playerName = 'TestPlayer'

      // Act
      const player = PlayerStats.createNewPlayerStats(playerName)

      // Assert
      expect(player.playerName).toBe(playerName)
      expect(player.kills).toBe(0)
      expect(player.deaths).toBe(0)
      expect(player.weaponsUsed).toEqual(new Map())
      expect(player.bestStreak).toBe(0)
      expect(player.KDA).toBe(0)
    })
  })

  describe('addKill', () => {
    let player: PlayerStats

    beforeEach(() => {
      player = PlayerStats.createNewPlayerStats('TestPlayer')
    })

    it('should increment kills correctly', () => {
      // Act
      player.addKill('AK47')

      // Assert
      expect(player.kills).toBe(1)
    })

    it('should increment count for weapons used', () => {
      // Arrange
      player.addKill('AK47')
      player.addKill('M4A1')

      // Act
      player.addKill('AK47')

      // Assert
      expect(player.weaponsUsed.get('AK47')).toBe(2)
      expect(player.weaponsUsed.get('M4A1')).toBe(1)
    })

    it('should handle best streak scenarios correctly', () => {
      // Test 1: First kill should set bestStreak to 1
      player.addKill('AK47')
      expect(player.bestStreak).toBe(1)

      // Test 2: Multiple kills should update bestStreak
      player.addKill('M4A1')
      player.addKill('AWP')
      expect(player.bestStreak).toBe(3)

      // Test 3: Death resets current streak but preserves bestStreak
      player.addDeath()
      expect(player.bestStreak).toBe(3)

      // Test 4: New streak lower than best should not update bestStreak
      player.addKill('Glock')
      player.addKill('USP')
      expect(player.bestStreak).toBe(3) // Should still be 3, not 2

      // Test 5: New streak higher than best should update bestStreak
      player.addKill('Deagle')
      player.addKill('Scout')
      expect(player.bestStreak).toBe(4) // Should now be 4
    })
  })

  describe('addDeath', () => {
    let player: PlayerStats

    beforeEach(() => {
      player = PlayerStats.createNewPlayerStats('TestPlayer')
    })

    it('should increment deaths correctly', () => {
      // Act
      player.addDeath()

      // Assert
      expect(player.deaths).toBe(1)
    })

    it('should handle multiple consecutive deaths', () => {
      // Act
      player.addDeath()
      player.addDeath()
      player.addDeath()

      // Assert
      expect(player.deaths).toBe(3)
    })
  })

  describe('KDA', () => {
    let player: PlayerStats

    beforeEach(() => {
      player = PlayerStats.createNewPlayerStats('TestPlayer')
    })

    it('should return kills when deaths is 0', () => {
      // Arrange
      player.addKill('AK47')
      player.addKill('M4A1')
      player.addKill('AWP')

      // Assert
      expect(player.KDA).toBe(3)
    })

    it('should calculate KDA correctly when deaths > 0', () => {
      // Arrange
      player.addKill('AK47')
      player.addKill('M4A1')
      player.addKill('M4A1')
      player.addDeath()
      player.addDeath()

      // Assert
      expect(player.KDA).toBe(1.5)
    })
  })

  describe('reportStats', () => {
    let player: PlayerStats

    beforeEach(() => {
      player = PlayerStats.createNewPlayerStats('TestPlayer')
    })

    it('should return complete stats object', () => {
      // Arrange
      player.addKill('AK47')
      player.addKill('AK47')
      player.addKill('M4A1')
      player.addDeath()

      // Act
      const stats = player.reportStats()

      // Assert
      expect(stats).toEqual({
        playerName: 'TestPlayer',
        kills: 3,
        deaths: 1,
        KDA: 3,
        bestStreak: 3,
        weaponsUsed: { 'AK47': 2, 'M4A1': 1 }
      })
    })
  })
})
