import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { EntityNotFoundErrorFilter } from '@/infra/http/errors-filters/entity-not-found';

describe('MatchController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Register global error filters
    app.useGlobalFilters(new EntityNotFoundErrorFilter());

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    // Clean up database after each test
    await prismaService.cleanDatabase();

    await app.close();
  });

  // Helper function to seed match data in the database
  const createMatchWithPlayers = async (matchId: string, players: Array<{
    playerName: string;
    kills: number;
    deaths: number;
    bestStreak: number;
    weaponStats?: Record<string, number>;
  }>) => {
    const startTime = new Date('2025-08-14T15:34:22.000Z');
    const endTime = new Date('2025-08-14T15:39:22.000Z');

    await prismaService.match.create({
      data: {
        id: matchId,
        startTime,
        endTime,
        playerStats: {
          create: players.map(player => ({
            playerName: player.playerName,
            kills: player.kills,
            deaths: player.deaths,
            bestStreak: player.bestStreak,
            weaponStats: player.weaponStats || {},
          }))
        }
      }
    });
  };

  describe('/matches/:id/ranking (GET)', () => {
    beforeEach(async () => {
      await createMatchWithPlayers('11348965', [
        { playerName: 'Nick', kills: 3, deaths: 3, bestStreak: 2, weaponStats: { AK47: 3 } },
        { playerName: 'Roman', kills: 2, deaths: 3, bestStreak: 1, weaponStats: { AK47: 2 } }
      ]);
    });

    it('should return match ranking for existing match', async () => {
      const response = await request(app.getHttpServer())
        .get('/matches/11348965/ranking')
        .expect(200);

      expect(response.body).toHaveProperty('matchId');
      expect(response.body).toHaveProperty('ranking');
      expect(response.body.matchId).toBe('11348965');
      expect(Array.isArray(response.body.ranking)).toBe(true);
      expect(response.body.ranking).toHaveLength(2);

      // Verify ranking structure
      response.body.ranking.forEach((player: any) => {
        expect(player).toHaveProperty('position');
        expect(player).toHaveProperty('playerName');
        expect(player).toHaveProperty('kills');
        expect(player).toHaveProperty('deaths');
        expect(player).toHaveProperty('KDA');
        expect(player).toHaveProperty('weaponsUsed');
        expect(player).toHaveProperty('bestStreak');
        expect(typeof player.position).toBe('number');
        expect(typeof player.playerName).toBe('string');
        expect(typeof player.kills).toBe('number');
        expect(typeof player.deaths).toBe('number');
        expect(typeof player.KDA).toBe('number');
        expect(typeof player.weaponsUsed).toBe('object');
        expect(typeof player.bestStreak).toBe('number');
      });

      // Verify ranking order (Nick should be first with 3 kills, Roman second with 2 kills)
      expect(response.body.ranking[0].playerName).toBe('Nick');
      expect(response.body.ranking[0].position).toBe(1);
      expect(response.body.ranking[0].kills).toBe(3);
      expect(response.body.ranking[0].deaths).toBe(3);
      expect(response.body.ranking[0].KDA).toBe(1);
      expect(response.body.ranking[0].weaponsUsed).toEqual({ AK47: 3 });
      expect(response.body.ranking[0].bestStreak).toBe(2);

      expect(response.body.ranking[1].playerName).toBe('Roman');
      expect(response.body.ranking[1].position).toBe(2);
      expect(response.body.ranking[1].kills).toBe(2);
      expect(response.body.ranking[1].deaths).toBe(3);
      expect(response.body.ranking[1].KDA).toBe(0.67);
      expect(response.body.ranking[1].weaponsUsed).toEqual({ AK47: 2 });
      expect(response.body.ranking[1].bestStreak).toBe(1);
    });

    it('should return 400 error for non-existent match', async () => {
      const response = await request(app.getHttpServer())
        .get('/matches/non-existent-match/ranking')
        .expect(400);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('message');
      expect(response.body.name).toBe('EntityNotFoundError');
      expect(response.body.message).toBe('Match with ID non-existent-match not found');
    });

    it('should work with complex match data', async () => {
      await createMatchWithPlayers('complex-match', [
        { playerName: 'TopPlayer', kills: 4, deaths: 1, bestStreak: 3, weaponStats: { AK47: 3 } },
        { playerName: 'MidPlayer', kills: 1, deaths: 2, bestStreak: 1, weaponStats: { AK47: 1 } },
        { playerName: 'BottomPlayer', kills: 1, deaths: 3, bestStreak: 1, weaponStats: { AK47: 1 } }
      ]);

      const response = await request(app.getHttpServer())
        .get('/matches/complex-match/ranking')
        .expect(200);

      expect(response.body.matchId).toBe('complex-match');
      expect(response.body.ranking).toHaveLength(3);

      // TopPlayer: 4 kills, 1 death, KDA = 4
      const topPlayer = response.body.ranking.find((p: any) => p.playerName === 'TopPlayer');
      expect(topPlayer.position).toBe(1);
      expect(topPlayer.kills).toBe(4);
      expect(topPlayer.deaths).toBe(1);
      expect(topPlayer.KDA).toBe(4);
      expect(topPlayer.weaponsUsed).toEqual({ AK47: 3 });
      expect(topPlayer.bestStreak).toBe(3);

      // MidPlayer: 1 kill, 2 deaths, KDA = 0.5
      const midPlayer = response.body.ranking.find((p: any) => p.playerName === 'MidPlayer');
      expect(midPlayer.position).toBe(2);
      expect(midPlayer.kills).toBe(1);
      expect(midPlayer.deaths).toBe(2);
      expect(midPlayer.KDA).toBe(0.5);
      expect(midPlayer.weaponsUsed).toEqual({ AK47: 1 });
      expect(midPlayer.bestStreak).toBe(1);

      // BottomPlayer: 1 kill, 3 deaths, KDA = 0.33
      const bottomPlayer = response.body.ranking.find((p: any) => p.playerName === 'BottomPlayer');
      expect(bottomPlayer.position).toBe(3);
      expect(bottomPlayer.kills).toBe(1);
      expect(bottomPlayer.deaths).toBe(3);
      expect(bottomPlayer.KDA).toBe(0.33);
      expect(bottomPlayer.weaponsUsed).toEqual({ AK47: 1 });
      expect(bottomPlayer.bestStreak).toBe(1);
    });
  });
});
