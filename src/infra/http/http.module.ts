import { Module } from "@nestjs/common";
import { GameLogsModule } from "./game-logs/game-logs.module";

@Module({
  imports: [GameLogsModule],
})
export class HttpModule { }