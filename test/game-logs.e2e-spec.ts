import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { EntityAlreadyExistsErrorFilter } from '@/infra/http/errors-filters/entity-already-exists';
import * as path from 'path';
import * as fs from 'fs';

describe('GameLogsController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Register global error filters
    app.useGlobalFilters(new EntityAlreadyExistsErrorFilter());

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    // Clean up database after each test
    await prismaService.cleanDatabase();

    await app.close();
  });

  describe('/game-logs/upload (POST)', () => {
    const validLogContent = `23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:36:04 - Roman killed Nick using M16
23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN
23/04/2019 15:36:35 - Nick killed Roman using AK47
23/04/2019 15:36:36 - Nick killed Roman using AK47
23/04/2019 15:36:37 - Roman killed Nick using MP5
23/04/2019 15:36:38 - Nick killed Roman using AK47
23/04/2019 15:39:22 - Match 11348965 has ended`;

    it('should successfully upload and process a valid .log file', async () => {
      const response = await request(app.getHttpServer())
        .post('/game-logs/upload')
        .attach('file', Buffer.from(validLogContent), 'test-game.log')
        .expect(201);

      expect(response.body).toHaveProperty('processedMatches');
      expect(response.body).toHaveProperty('parseErrors');
      expect(typeof response.body.processedMatches).toBe('number');
      expect(Array.isArray(response.body.parseErrors)).toBe(true);
      expect(response.body.processedMatches).toBe(1);
      expect(response.body.parseErrors).toEqual([]);
    });

    it('should successfully upload and process a valid .txt file', async () => {
      const response = await request(app.getHttpServer())
        .post('/game-logs/upload')
        .attach('file', Buffer.from(validLogContent), 'test-game.txt')
        .expect(201);

      expect(response.body).toHaveProperty('processedMatches');
      expect(response.body).toHaveProperty('parseErrors');
      expect(typeof response.body.processedMatches).toBe('number');
      expect(Array.isArray(response.body.parseErrors)).toBe(true);
    });

    it('should reject files with invalid extensions', async () => {
      const response = await request(app.getHttpServer())
        .post('/game-logs/upload')
        .attach('file', Buffer.from(validLogContent), 'test-game.json')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid file extension');
      expect(response.body.message).toContain('.log, .txt');
    });

    it('should reject requests with no file uploaded', async () => {
      const response = await request(app.getHttpServer())
        .post('/game-logs/upload')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('No file uploaded');
    });

    it('should handle malformed log content gracefully', async () => {
      const malformedContent = `This is not a valid game log format
    Some random text
    More invalid content`;

      const response = await request(app.getHttpServer())
        .post('/game-logs/upload')
        .attach('file', Buffer.from(malformedContent), 'malformed.log')
        .expect(201);

      expect(response.body).toHaveProperty('processedMatches');
      expect(response.body).toHaveProperty('parseErrors');
      expect(typeof response.body.processedMatches).toBe('number');
      expect(Array.isArray(response.body.parseErrors)).toBe(true);
      expect(response.body.parseErrors.length).toBe(3);
    });

    describe('Database Integration', () => {
      it('should persist match data to database', async () => {
        const response = await request(app.getHttpServer())
          .post('/game-logs/upload')
          .attach('file', Buffer.from(validLogContent), 'test-game.log')
          .expect(201);

        expect(response.body.processedMatches).toBe(1);

        // Verify data was persisted to database
        const match = await prismaService.match.findUnique({
          where: { id: '11348965' },
          include: { playerStats: true }
        });

        expect(match).toBeDefined();
        expect(match?.id).toBe('11348965');
        expect(match?.playerStats).toHaveLength(2);

        // Verify player stats
        const romanStats = match?.playerStats.find(p => p.playerName === 'Roman');
        const nickStats = match?.playerStats.find(p => p.playerName === 'Nick');

        expect(romanStats).toBeDefined();
        expect(romanStats?.kills).toBe(2);
        expect(romanStats?.deaths).toBe(3);
        expect(romanStats?.bestStreak).toBe(1);

        expect(nickStats).toBeDefined();
        expect(nickStats?.kills).toBe(3);
        expect(nickStats?.deaths).toBe(3);
        expect(nickStats?.bestStreak).toBe(2);
      });

      it('should handle duplicate match uploads with proper error response', async () => {
        // First upload - should succeed
        await request(app.getHttpServer())
          .post('/game-logs/upload')
          .attach('file', Buffer.from(validLogContent), 'test-game.log')
          .expect(201);

        // Second upload of same match - should return error
        const response = await request(app.getHttpServer())
          .post('/game-logs/upload')
          .attach('file', Buffer.from(validLogContent), 'test-game.log')
          .expect(400);

        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('message');
        expect(response.body.name).toBe('EntityAlreadyExistsError');
        expect(response.body.message).toContain('Match with id 11348965 already exists');

        // Verify only one match exists in database
        const matchCount = await prismaService.match.count();
        expect(matchCount).toBe(1);
      });

      it('should persist multiple matches correctly', async () => {
        const multiMatchContent = `23/04/2019 15:34:22 - New match match-1 has started
    23/04/2019 15:36:04 - Roman killed Nick using M16
    23/04/2019 15:39:22 - Match match-1 has ended
    24/04/2019 10:00:00 - New match match-2 has started
    24/04/2019 10:05:00 - Player1 killed Player2 using AK47
    24/04/2019 10:10:00 - Match match-2 has ended`;

        const response = await request(app.getHttpServer())
          .post('/game-logs/upload')
          .attach('file', Buffer.from(multiMatchContent), 'multi-match.log')
          .expect(201);

        expect(response.body.processedMatches).toBe(2);

        // Verify both matches were persisted
        const matches = await prismaService.match.findMany({
          include: { playerStats: true },
          orderBy: { startTime: 'asc' }
        });

        expect(matches).toHaveLength(2);
        expect(matches[0].id).toBe('match-1');
        expect(matches[1].id).toBe('match-2');
        expect(matches[0].playerStats).toHaveLength(2);
        expect(matches[1].playerStats).toHaveLength(2);
      });
    });

    describe('Integration with real example files', () => {
      it('should process the test-1-match.log example file and persist to database', async () => {
        const exampleFilePath = path.join(__dirname, '../game-logs-examples/test-1-match.log');

        // Check if the example file exists
        if (fs.existsSync(exampleFilePath)) {
          const fileContent = fs.readFileSync(exampleFilePath);

          const response = await request(app.getHttpServer())
            .post('/game-logs/upload')
            .attach('file', fileContent, 'test-1-match.log')
            .expect(201);

          expect(response.body).toHaveProperty('processedMatches');
          expect(response.body).toHaveProperty('parseErrors');
          expect(response.body.processedMatches).toBeGreaterThanOrEqual(1);

          // Verify data was persisted to database
          const matchCount = await prismaService.match.count();
          expect(matchCount).toBe(response.body.processedMatches);

          const playerStatsCount = await prismaService.playerStats.count();
          expect(playerStatsCount).toBeGreaterThan(0);
        } else {
          console.warn('Example file test-1-match.log not found, skipping integration test');
        }
      });

      it('should process the test-3-matches.log example file and persist to database', async () => {
        const exampleFilePath = path.join(__dirname, '../game-logs-examples/test-3-matches.log');

        // Check if the example file exists
        if (fs.existsSync(exampleFilePath)) {
          const fileContent = fs.readFileSync(exampleFilePath);

          const response = await request(app.getHttpServer())
            .post('/game-logs/upload')
            .attach('file', fileContent, 'test-3-matches.log')
            .expect(201);

          expect(response.body).toHaveProperty('processedMatches');
          expect(response.body).toHaveProperty('parseErrors');
          expect(response.body.processedMatches).toBeGreaterThanOrEqual(3);

          // Verify data was persisted to database
          const matchCount = await prismaService.match.count();
          expect(matchCount).toBe(response.body.processedMatches);

          const playerStatsCount = await prismaService.playerStats.count();
          expect(playerStatsCount).toBeGreaterThan(0);

          // Verify all matches have proper structure
          const matches = await prismaService.match.findMany({
            include: { playerStats: true }
          });

          matches.forEach(match => {
            expect(match.id).toBeDefined();
            expect(match.startTime).toBeInstanceOf(Date);
            expect(match.endTime).toBeInstanceOf(Date);
            expect(match.playerStats.length).toBeGreaterThan(0);
          });
        } else {
          console.warn('Example file test-3-matches.log not found, skipping integration test');
        }
      });
    });
  });

});
