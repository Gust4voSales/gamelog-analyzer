import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import * as path from 'path';
import * as fs from 'fs';

describe('GameLogsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
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
      expect(response.body.processedMatches).toBeGreaterThanOrEqual(0);
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

    describe('Integration with real example files', () => {
      it('should process the test-1-match.log example file', async () => {
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
        } else {
          console.warn('Example file test-1-match.log not found, skipping integration test');
        }
      });

      it('should process the test-3-matches.log example file', async () => {
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
        } else {
          console.warn('Example file test-3-matches.log not found, skipping integration test');
        }
      });
    });
  });

});
