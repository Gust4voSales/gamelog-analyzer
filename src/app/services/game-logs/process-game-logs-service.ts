import { MatchesLogsParser } from "./matches-logs-parser";

export class ProcessGameLogsService {
  constructor(private parser: MatchesLogsParser) { }

  public async execute(logContent: string) {
    const output = this.parser.execute(logContent);

    // debug output
    output.matches.forEach(match => {
      console.log('\n---------------------------------------------------------')
      const matchData = {
        id: match.id,
        startTime: match.startTime,
        endTime: match.endTime,
      }
      console.log(matchData)
      match.playerStats.forEach(player => {
        console.log(player)
      })
    })
    console.log('parseErrors', output.parseErrors)
  }
}