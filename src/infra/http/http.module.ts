import { Module } from "@nestjs/common";
import { GameLogsModule } from "./game-logs/game-logs.module";
import { MatchModule } from "./match/match.module";

@Module({
  imports: [GameLogsModule, MatchModule],
})
export class HttpModule { }