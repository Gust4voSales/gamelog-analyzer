import { GetGlobalRankingService } from './get-global-ranking.service';
import { PlayerStatsRepository } from '../../repositories/player-stats-repository';
import { PlayerStat } from '../../entities/player-stat';

describe('GetGlobalRankingService', () => {
  let service: GetGlobalRankingService;
  let mockPlayerStatsRepository: jest.Mocked<PlayerStatsRepository>;

  beforeEach(() => {
    mockPlayerStatsRepository = {
      getGlobalRanking: jest.fn(),
    };

    service = new GetGlobalRankingService(mockPlayerStatsRepository);
  });

  describe('execute', () => {
    it('should return empty array when no players exist', async () => {
      // Arrange
      mockPlayerStatsRepository.getGlobalRanking.mockResolvedValue([]);

      // Act
      const result = await service.execute();

      // Assert
      expect(result).toEqual([]);
      expect(mockPlayerStatsRepository.getGlobalRanking).toHaveBeenCalledTimes(1);
    });

    it('should sort players by KDA (descending)', async () => {
      // Arrange
      const player1 = PlayerStat.create({
        playerName: 'Player1',
        totalKills: 10,
        totalDeaths: 5, // KDA: 2
        bestStreak: 3,
        matchesPlayed: 2,
      });

      const player2 = PlayerStat.create({
        playerName: 'Player2',
        totalKills: 15,
        totalDeaths: 3, // KDA: 5
        bestStreak: 8,
        matchesPlayed: 4,
      });

      const player3 = PlayerStat.create({
        playerName: 'Player3',
        totalKills: 8,
        totalDeaths: 2, // KDA: 4
        bestStreak: 6,
        matchesPlayed: 3,
      });

      mockPlayerStatsRepository.getGlobalRanking.mockResolvedValue([player1, player2, player3]);

      // Act
      const result = await service.execute();

      // Assert
      expect(result).toHaveLength(3);

      // Should be sorted by KDA: Player2 (5), Player3 (4), Player1 (2)
      expect(result[0].playerName).toBe('Player2');
      expect(result[0].overallKDA).toBe(5);

      expect(result[1].playerName).toBe('Player3');
      expect(result[1].overallKDA).toBe(4);

      expect(result[2].playerName).toBe('Player1');
      expect(result[2].overallKDA).toBe(2);
    });

    it('should handle complex ranking scenario with mixed stats', async () => {
      // Arrange
      const players = [
        PlayerStat.create({
          playerName: 'TopPlayer',
          totalKills: 100,
          totalDeaths: 10, // KDA: 10
          bestStreak: 15,
          matchesPlayed: 10,
        }),
        PlayerStat.create({
          playerName: 'MidPlayer1',
          totalKills: 50,
          totalDeaths: 10, // KDA: 5
          bestStreak: 8,
          matchesPlayed: 8,
        }),
        PlayerStat.create({
          playerName: 'MidPlayer2',
          totalKills: 60,
          totalDeaths: 12, // KDA: 5
          bestStreak: 10,
          matchesPlayed: 6,
        }),
        PlayerStat.create({
          playerName: 'PerfectPlayer',
          totalKills: 25,
          totalDeaths: 0, // KDA: 25
          bestStreak: 25,
          matchesPlayed: 3,
        }),
        PlayerStat.create({
          playerName: 'WeakPlayer',
          totalKills: 5,
          totalDeaths: 20, // KDA: 0.25
          bestStreak: 2,
          matchesPlayed: 15,
        }),
      ];

      mockPlayerStatsRepository.getGlobalRanking.mockResolvedValue(players);

      // Act
      const result = await service.execute();

      // Assert
      expect(result).toHaveLength(5);

      // Expected order: PerfectPlayer (25), TopPlayer (10), MidPlayer2 (5, 60 kills), MidPlayer1 (5, 50 kills), WeakPlayer (0.25)
      expect(result[0].playerName).toBe('PerfectPlayer');
      expect(result[0].overallKDA).toBe(25);

      expect(result[1].playerName).toBe('TopPlayer');
      expect(result[1].overallKDA).toBe(10);

      expect(result[2].playerName).toBe('MidPlayer2');
      expect(result[2].overallKDA).toBe(5);
      expect(result[2].totalKills).toBe(60);

      expect(result[3].playerName).toBe('MidPlayer1');
      expect(result[3].overallKDA).toBe(5);
      expect(result[3].totalKills).toBe(50);

      expect(result[4].playerName).toBe('WeakPlayer');
      expect(result[4].overallKDA).toBe(0.25);
    });

    it('should transform PlayerStat entities to correct GlobalPlayerRanking format', async () => {
      // Arrange
      const playerStat = PlayerStat.create({
        playerName: 'TestPlayer',
        totalKills: 42,
        totalDeaths: 7,
        bestStreak: 12,
        matchesPlayed: 5,
      });

      mockPlayerStatsRepository.getGlobalRanking.mockResolvedValue([playerStat]);

      // Act
      const result = await service.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        playerName: 'TestPlayer',
        totalKills: 42,
        totalDeaths: 7,
        overallKDA: 6, // 42/7 = 6
        bestStreak: 12,
        matchesPlayed: 5,
      });
    });
  });
});
