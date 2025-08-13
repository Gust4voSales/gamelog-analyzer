import { Injectable, Scope } from '@nestjs/common';
import { Match } from '../../entities/match';
import { BaseEvent, GameEvent, KillEvent, MatchEndEvent, MatchStartEvent, UnknownEvent, WorldKillEvent } from '../../types/game-event.types';

interface MatchesLogsParserExecuteOutput {
  matches: Match[]
  parseErrors: string[]
}

@Injectable({ scope: Scope.REQUEST }) // each request has its own instance
export class MatchesLogsParser {
  private static readonly EVENTS_PATTERNS_REGEX = {
    DATE: /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - (.+)$/,
    MATCH_START: /^New match (.+?) has started$/,
    MATCH_END: /^Match (.+?) has ended$/,
    KILL: /^(.+?) killed (.+?) using (.+)$/,
    WORLD_KILL: /^<WORLD> killed (.+?) by (.+)$/,
  }

  private matches: Match[] = [];
  private currentMatch: Match | null = null;
  private parseErrors: string[] = [];

  // simplified strategy pattern
  private eventsHandlers: Map<GameEvent['type'] | "UNKNOWN", (event: GameEvent) => void> = new Map([
    ["MATCH_START", this.handleMatchStartEvent.bind(this)],
    ["MATCH_END", this.handleMatchEndEvent.bind(this)],
    ["KILL", this.handleKillEvent.bind(this)],
    ["WORLD_KILL", this.handleWorldKillEvent.bind(this)],
    ["UNKNOWN", this.handleUnknownEvent.bind(this)],
  ]);

  // ====================================================================
  // public methods

  /**
   * Parses game log content and extracts match data with player statistics.
   * 
   * This method processes raw log content line by line, identifying and parsing
   * different types of game events (match start/end, kills, world kills) and
   * organizing them into structured Match objects with player statistics.
   * 
   * @param logContent - Raw log content as a string, where each line represents
   *                     a timestamped game event in the format:
   *                     "DD/MM/YYYY HH:MM:SS - <event_message>"
   * 
   * @returns An object containing:
   *          - All processed matches
   *          - All parse errors
   * 
   * @example
   * ```typescript
   * const parser = new MatchesLogsParser();
   * const logContent = `
   *   23/04/1999 15:00:00 - New match 1 has started
   *   23/04/1999 15:01:30 - Player1 killed Player2 using Shotgun
   *   23/04/1999 15:15:00 - Match 1 has ended
   * `;
   * const matches = parser.execute(logContent);
   * console.log(`Parsed ${matches.length} matches`);
   * ```
   * 
   * @remarks
   * - Empty lines are automatically skipped
   * - Malformed lines are logged as errors but don't interrupt processing
   * - Unknown event types are handled gracefully and logged
   * - The parser maintains state between events within the same match
   */
  public execute(logContent: string): MatchesLogsParserExecuteOutput {
    const lines = logContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        continue;
      }

      try {
        const event = this.parseLogLine(line);
        this.processEvent(event);
      } catch (error) {
        this.parseErrors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    return {
      matches: this.matches,
      parseErrors: this.parseErrors,
    };
  }

  // ====================================================================
  // private methods

  private parseLogLine(line: string): GameEvent {
    // Regex for date
    const dateMatch = line.match(MatchesLogsParser.EVENTS_PATTERNS_REGEX.DATE);
    if (!dateMatch) {
      throw new Error(`Invalid date format`);
    }

    const [, dateStr, message] = dateMatch;
    // Convert DD/MM/YYYY HH:MM:SS → YYYY-MM-DD HH:MM:SS
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const isoDateStr = `${year}-${month}-${day} ${timePart}`;
    const date = new Date(isoDateStr);

    const baseEvent: BaseEvent = {
      time: date,
    };

    // Match start
    let regexMatch = message.match(MatchesLogsParser.EVENTS_PATTERNS_REGEX.MATCH_START);
    if (regexMatch) {
      return {
        ...baseEvent,
        type: "MATCH_START",
        matchId: regexMatch[1]
      } satisfies MatchStartEvent;
    }

    // Match end
    regexMatch = message.match(MatchesLogsParser.EVENTS_PATTERNS_REGEX.MATCH_END);
    if (regexMatch) {
      return {
        ...baseEvent,
        type: "MATCH_END",
        matchId: regexMatch[1]
      } satisfies MatchEndEvent;
    }

    // Player kill
    regexMatch = message.match(MatchesLogsParser.EVENTS_PATTERNS_REGEX.KILL);
    if (regexMatch && regexMatch[1] !== "<WORLD>") {
      return {
        ...baseEvent,
        type: "KILL",
        killer: regexMatch[1],
        victim: regexMatch[2],
        weapon: regexMatch[3]
      } satisfies KillEvent;
    }

    // World kill
    regexMatch = message.match(MatchesLogsParser.EVENTS_PATTERNS_REGEX.WORLD_KILL);
    if (regexMatch) {
      return {
        ...baseEvent,
        type: "WORLD_KILL",
        victim: regexMatch[1],
        cause: regexMatch[2]
      } satisfies WorldKillEvent;
    }

    return {
      ...baseEvent,
      type: "UNKNOWN",
    } satisfies UnknownEvent;
  }

  // process event using a simplified strategy pattern
  private processEvent(event: GameEvent): void {
    const handler = this.eventsHandlers.get(event.type)
    handler?.(event)
  }

  // ====================================================================
  // handlers for each event type using a simplified strategy pattern

  private handleMatchStartEvent(event: MatchStartEvent) {
    if (this.currentMatch) {
      throw new Error(`Match already started before processing event '${event.type}'`);
    }
    this.currentMatch = Match.createNewMatch(event);
  }

  private handleMatchEndEvent(event: MatchEndEvent) {
    if (!this.currentMatch) {
      throw new Error(`Match not started before processing event '${event.type}'`);
    }
    this.currentMatch.endMatch(event)
    this.matches.push(this.currentMatch)
    this.currentMatch = null
  }

  private handleKillEvent(event: KillEvent) {
    if (!this.currentMatch) {
      throw new Error(`Match not started before processing event '${event.type}'`);
    }
    this.currentMatch.addKillEvent(event)
  }

  private handleWorldKillEvent(event: WorldKillEvent) {
    if (!this.currentMatch) {
      throw new Error(`Match not started before processing event '${event.type}'`);
    }
    this.currentMatch.addWorldKillEvent(event)
  }

  private handleUnknownEvent(_: GameEvent) {
    throw new Error(`Unknown event type`);
  }
}
