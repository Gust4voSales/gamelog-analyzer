import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

describe('PlayersController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    // Clean up database after each test
    await prismaService.cleanDatabase();
    await app.close();
  });

  // Helper function to seed player stats data across multiple matches
  const seedPlayerStatsData = async (matches: Array<{
    matchId: string;
    players: Array<{
      playerName: string;
      kills: number;
      deaths: number;
      bestStreak: number;
      weaponStats?: Record<string, number>;
    }>;
  }>) => {
    for (const match of matches) {
      const startTime = new Date('2025-08-14T15:34:22.000Z');
      const endTime = new Date('2025-08-14T15:39:22.000Z');

      await prismaService.match.create({
        data: {
          id: match.matchId,
          startTime,
          endTime,
          playerStats: {
            create: match.players.map(player => ({
              playerName: player.playerName,
              kills: player.kills,
              deaths: player.deaths,
              bestStreak: player.bestStreak,
              weaponStats: player.weaponStats || {},
            }))
          }
        }
      });
    }
  };

  describe('/players/ranking (GET)', () => {
    it('should return empty ranking array when no players exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/players/ranking')
        .expect(200);

      expect(response.body).toHaveProperty('ranking');
      expect(Array.isArray(response.body.ranking)).toBe(true);
      expect(response.body.ranking).toHaveLength(0);
    });

    it('should return complex ranking scenario with mixed stats', async () => {
      // Arrange - Seed data
      await seedPlayerStatsData([
        {
          matchId: 'match1',
          players: [
            { playerName: 'TopPlayer', kills: 60, deaths: 6, bestStreak: 10, weaponStats: { AK47: 40, M16: 20 } },
            { playerName: 'MidPlayer1', kills: 30, deaths: 6, bestStreak: 5, weaponStats: { AK47: 30 } },
            { playerName: 'PerfectPlayer', kills: 15, deaths: 0, bestStreak: 15, weaponStats: { AK47: 15 } },
          ]
        },
        {
          matchId: 'match2',
          players: [
            { playerName: 'TopPlayer', kills: 40, deaths: 4, bestStreak: 8, weaponStats: { M16: 25, MP5: 15 } },
            { playerName: 'MidPlayer1', kills: 20, deaths: 4, bestStreak: 6, weaponStats: { AK47: 20 } },
            { playerName: 'MidPlayer2', kills: 60, deaths: 12, bestStreak: 10, weaponStats: { AK47: 60 } },
            { playerName: 'WeakPlayer', kills: 5, deaths: 20, bestStreak: 2, weaponStats: { M16: 5 } },
          ]
        },
        {
          matchId: 'match3',
          players: [
            { playerName: 'PerfectPlayer', kills: 10, deaths: 0, bestStreak: 10, weaponStats: { M16: 10 } },
          ]
        }
      ]);

      // Act
      const response = await request(app.getHttpServer())
        .get('/players/ranking')
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('ranking');
      expect(Array.isArray(response.body.ranking)).toBe(true);
      expect(response.body.ranking).toHaveLength(5);

      // Verify ranking structure and order
      const ranking = response.body.ranking;

      // Each player should have the correct structure
      ranking.forEach((player: any) => {
        expect(player).toHaveProperty('playerName');
        expect(player).toHaveProperty('totalKills');
        expect(player).toHaveProperty('totalDeaths');
        expect(player).toHaveProperty('overallKDA');
        expect(player).toHaveProperty('bestStreak');
        expect(player).toHaveProperty('matchesPlayed');
        expect(typeof player.playerName).toBe('string');
        expect(typeof player.totalKills).toBe('number');
        expect(typeof player.totalDeaths).toBe('number');
        expect(typeof player.overallKDA).toBe('number');
        expect(typeof player.bestStreak).toBe('number');
        expect(typeof player.matchesPlayed).toBe('number');
      });

      // Expected aggregated stats:
      // PerfectPlayer: 25 kills, 0 deaths, KDA = 25, bestStreak = 15, matches = 2
      // TopPlayer: 100 kills, 10 deaths, KDA = 10, bestStreak = 10, matches = 2  
      // MidPlayer2: 60 kills, 12 deaths, KDA = 5, bestStreak = 10, matches = 1
      // MidPlayer1: 50 kills, 10 deaths, KDA = 5, bestStreak = 6, matches = 2
      // WeakPlayer: 5 kills, 20 deaths, KDA = 0.25, bestStreak = 2, matches = 1

      // Expected order: PerfectPlayer (25), TopPlayer (10), MidPlayer2 (5, 60 kills), MidPlayer1 (5, 50 kills), WeakPlayer (0.25)
      expect(ranking[0].playerName).toBe('PerfectPlayer');
      expect(ranking[0].totalKills).toBe(25);
      expect(ranking[0].totalDeaths).toBe(0);
      expect(ranking[0].overallKDA).toBe(25);
      expect(ranking[0].bestStreak).toBe(15);
      expect(ranking[0].matchesPlayed).toBe(2);

      expect(ranking[1].playerName).toBe('TopPlayer');
      expect(ranking[1].totalKills).toBe(100);
      expect(ranking[1].totalDeaths).toBe(10);
      expect(ranking[1].overallKDA).toBe(10);
      expect(ranking[1].bestStreak).toBe(10);
      expect(ranking[1].matchesPlayed).toBe(2);

      expect(ranking[2].playerName).toBe('MidPlayer2');
      expect(ranking[2].totalKills).toBe(60);
      expect(ranking[2].totalDeaths).toBe(12);
      expect(ranking[2].overallKDA).toBe(5);
      expect(ranking[2].bestStreak).toBe(10);
      expect(ranking[2].matchesPlayed).toBe(1);

      expect(ranking[3].playerName).toBe('MidPlayer1');
      expect(ranking[3].totalKills).toBe(50);
      expect(ranking[3].totalDeaths).toBe(10);
      expect(ranking[3].overallKDA).toBe(5);
      expect(ranking[3].bestStreak).toBe(6);
      expect(ranking[3].matchesPlayed).toBe(2);

      // WeakPlayer should be last
      expect(ranking[4].playerName).toBe('WeakPlayer');
      expect(ranking[4].totalKills).toBe(5);
      expect(ranking[4].totalDeaths).toBe(20);
      expect(ranking[4].overallKDA).toBe(0.25);
      expect(ranking[4].bestStreak).toBe(2);
      expect(ranking[4].matchesPlayed).toBe(1);
    });
  });
});
