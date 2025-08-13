type GameEvent =
  | MatchStartEvent
  | KillEvent
  | WorldKillEvent
  | MatchEndEvent
  | UnknownEvent;

interface BaseEvent {
  time: Date;
}

interface MatchStartEvent extends BaseEvent {
  type: "MATCH_START";
  matchId: string;
}

interface MatchEndEvent extends BaseEvent {
  type: "MATCH_END";
  matchId: string;
}

interface KillEvent extends BaseEvent {
  type: "KILL";
  killer: string;
  victim: string;
  weapon: string;
}

interface WorldKillEvent extends BaseEvent {
  type: "WORLD_KILL";
  victim: string;
  cause: string;
}

interface UnknownEvent extends BaseEvent {
  type: "UNKNOWN";
}

export type { GameEvent, BaseEvent, MatchStartEvent, MatchEndEvent, KillEvent, WorldKillEvent, UnknownEvent };