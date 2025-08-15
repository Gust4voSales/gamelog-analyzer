import { Module } from "@nestjs/common";
import { GameLogsModule } from "./game-logs/game-logs.module";
import { MatchModule } from "./match/match.module";
import { PlayersModule } from "./players/players.module";

@Module({
  imports: [GameLogsModule, MatchModule, PlayersModule],
})
export class HttpModule { }