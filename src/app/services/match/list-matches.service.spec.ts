import { ListMatchesService } from './list-matches.service';
import { MatchRepository } from '../../repositories/match-repository';
import { Match } from '../../entities/match';
import { PlayerStats } from '../../entities/player-stats';

describe('ListMatchesService', () => {
  let service: ListMatchesService;
  let mockMatchRepository: jest.Mocked<MatchRepository>;

  beforeEach(() => {
    mockMatchRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      createBatch: jest.fn(),
      deleteAll: jest.fn(),
    };

    service = new ListMatchesService(mockMatchRepository);
  });

  describe('execute', () => {
    it('should return empty array when no matches exist', async () => {
      // Arrange
      mockMatchRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.execute();

      // Assert
      expect(result).toEqual([]);
      expect(mockMatchRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return matches', async () => {
      // Arrange
      const startTime1 = new Date('2024-01-01T10:00:00Z');
      const endTime1 = new Date('2024-01-01T10:30:00Z');
      const startTime2 = new Date('2024-01-01T11:00:00Z');

      const player1 = PlayerStats.create({
        playerName: 'Player1',
        kills: 10,
        deaths: 2,
        weaponsUsed: new Map([['AK47', 8], ['M4A1', 2]]),
        bestStreak: 5,
      });

      const player2 = PlayerStats.create({
        playerName: 'Player2',
        kills: 15,
        deaths: 3,
        weaponsUsed: new Map([['AWP', 10], ['Glock', 5]]),
        bestStreak: 8,
      });

      const player3 = PlayerStats.create({
        playerName: 'Player3',
        kills: 5,
        deaths: 1,
        weaponsUsed: new Map([['Knife', 5]]),
        bestStreak: 3,
      });

      const match1 = Match.create({
        id: 'match-1',
        startTime: startTime1,
        endTime: endTime1,
        playerStats: [player1, player2],
      });

      const match2 = Match.create({
        id: 'match-2',
        startTime: startTime2,
        endTime: null, // Ongoing match
        playerStats: [player3],
      });

      mockMatchRepository.findAll.mockResolvedValue([match1, match2]);

      // Act
      const result = await service.execute();

      // Assert
      expect(result).toHaveLength(2);

      // Check first match
      expect(result[0]).toEqual({
        id: 'match-1',
        startTime: startTime1,
        endTime: endTime1,
        players: [
          { name: 'Player1' },
          { name: 'Player2' },
        ],
      });

      // Check second match 
      expect(result[1]).toEqual({
        id: 'match-2',
        startTime: startTime2,
        endTime: null,
        players: [
          { name: 'Player3' },
        ],
      });

      expect(mockMatchRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle matches with no players', async () => {
      // Arrange
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T10:30:00Z');

      const emptyMatch = Match.create({
        id: 'empty-match',
        startTime: startTime,
        endTime: endTime,
        playerStats: [],
      });

      mockMatchRepository.findAll.mockResolvedValue([emptyMatch]);

      // Act
      const result = await service.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'empty-match',
        startTime: startTime,
        endTime: endTime,
        players: [],
      });
      expect(mockMatchRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
