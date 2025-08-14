import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma';
import { EnvConfig } from '@/config/env';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: EnvConfig.databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();

    // If in test environment, ensure database is clean and migrated
    if (EnvConfig.isTestEnvironment) {
      await this.cleanDatabase();
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (!EnvConfig.isTestEnvironment) { return }

    // Delete all data in reverse order of dependencies
    await this.playerStats.deleteMany({});
    await this.match.deleteMany({});
  }
}
