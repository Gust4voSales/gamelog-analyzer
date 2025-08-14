import { Module } from "@nestjs/common";

import { GameLogsController } from "./game-logs.controller";
import { ProcessGameLogsService } from "@/app/services/game-logs/process-game-logs.service";
import { MatchesLogsParser } from "@/app/services/game-logs/matches-logs-parser";
import { DatabaseModule } from "@/infra/database/database.module";

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [GameLogsController],
  providers: [ProcessGameLogsService, MatchesLogsParser],
})
export class GameLogsModule { }