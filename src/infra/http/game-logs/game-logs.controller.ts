import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProcessGameLogsService } from "@/app/services/game-logs/process-game-logs.service";
import path from "node:path";

@Controller("game-logs")
export class GameLogsController {
  constructor(private processGameLogsService: ProcessGameLogsService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file extension
    const allowedExtensions = ['.log', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file extension. Only ${allowedExtensions.join(', ')} files are allowed`
      );
    }

    const result = await this.processGameLogsService.execute(file.buffer.toString());

    return {
      processedMatches: result.processedMatches,
      parseErrors: result.parseErrors,
    };
  }
} 