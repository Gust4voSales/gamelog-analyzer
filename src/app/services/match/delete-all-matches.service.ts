import { Injectable } from '@nestjs/common';
import { MatchRepository } from '../../repositories/match-repository';

// 💀 
// Dangerous service.
// I created this service to help me test the application whenever I needed to upload a new log file I wouldn't need 
// to change the ids of the matches from the log file. Just delete all previous matches with this service.
// 💀
@Injectable()
export class DeleteAllMatchesService {
  constructor(private readonly matchRepository: MatchRepository) { }

  async execute(): Promise<void> {
    await this.matchRepository.deleteAll();
  }
}
