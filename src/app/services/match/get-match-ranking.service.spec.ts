import { GetMatchRankingService } from './get-match-ranking.service';
import { MatchRepository } from '../../repositories/match-repository';
import { Match } from '../../entities/match';
import { PlayerStats } from '../../entities/player-stats';
import { EntityNotFoundError } from '@/app/errors/entity-not-found';

describe('GetMatchRankingService', () => {
  let service: GetMatchRankingService;
  let mockMatchRepository: jest.Mocked<MatchRepository>;

  beforeEach(() => {
    mockMatchRepository = {
      findById: jest.fn(),
      createBatch: jest.fn(),
    };

    service = new GetMatchRankingService(mockMatchRepository);
  });

  describe('execute', () => {
    it('should throw EntityNotFoundError when match is not found', async () => {
      // Arrange
      mockMatchRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.execute('non-existent-match')).rejects.toThrow(EntityNotFoundError);
    });

    it('should return ranking sorted by kills (desc) then deaths (asc)', async () => {
      // Arrange
      const player1 = PlayerStats.create({
        playerName: 'Player1',
        kills: 10,
        deaths: 2,
        weaponsUsed: new Map(),
        bestStreak: 5,
      });

      const player2 = PlayerStats.create({
        playerName: 'Player2',
        kills: 15,
        deaths: 3,
        weaponsUsed: new Map(),
        bestStreak: 8,
      });

      const player3 = PlayerStats.create({
        playerName: 'Player3',
        kills: 10,
        deaths: 1, // Same kills as Player1, but fewer deaths
        weaponsUsed: new Map(),
        bestStreak: 6,
      });

      const match = Match.create({
        id: 'test-match',
        startTime: new Date(),
        endTime: new Date(),
        playerStats: [player1, player2, player3],
      });

      mockMatchRepository.findById.mockResolvedValue(match);

      // Act
      const result = await service.execute('test-match');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.matchId).toBe('test-match');
      expect(result!.ranking).toHaveLength(3);

      // Check ranking order: Player2 (15 kills), Player3 (10 kills, 1 death), Player1 (10 kills, 2 deaths)
      expect(result!.ranking[0]).toEqual({
        position: 1,
        playerName: 'Player2',
        kills: 15,
        deaths: 3,
        KDA: 5,
      });

      expect(result!.ranking[1]).toEqual({
        position: 2,
        playerName: 'Player3',
        kills: 10,
        deaths: 1,
        KDA: 10,
      });

      expect(result!.ranking[2]).toEqual({
        position: 3,
        playerName: 'Player1',
        kills: 10,
        deaths: 2,
        KDA: 5,
      });
    });

    it('should handle players with zero deaths correctly', async () => {
      // Arrange
      const playerWithZeroDeaths = PlayerStats.create({
        playerName: 'PlayerZeroDeaths',
        kills: 5,
        deaths: 0,
        weaponsUsed: new Map(),
        bestStreak: 5,
      });

      const match = Match.create({
        id: 'test-match',
        startTime: new Date(),
        endTime: new Date(),
        playerStats: [playerWithZeroDeaths],
      });

      mockMatchRepository.findById.mockResolvedValue(match);

      // Act
      const result = await service.execute('test-match');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.ranking[0]).toEqual({
        position: 1,
        playerName: 'PlayerZeroDeaths',
        kills: 5,
        deaths: 0,
        KDA: 5,
      });
    });
  });
});
