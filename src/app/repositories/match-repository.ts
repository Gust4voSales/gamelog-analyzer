import { Match } from "../entities/match";

export abstract class MatchRepository {
  abstract findById(id: string): Promise<Match | null>;
  abstract createBatch(matches: Match[]): Promise<void>;
}