import { Match } from "../entities/match";

export abstract class MatchRepository {
  abstract findById(id: string): Promise<Match | null>;
  abstract findAll(): Promise<Match[]>;
  abstract createBatch(matches: Match[]): Promise<void>;

  // 💀 
  // Dangerous method.
  // I created this method to help me test the application whenever I needed to upload a new log file I wouldn't need 
  // to change the ids of the matches from the log file. Just delete all previous matches with this method.
  // 💀
  abstract deleteAll(): Promise<void>;
}