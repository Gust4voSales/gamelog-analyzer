import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Response } from 'express';
import { EntityNotFoundError } from "@/app/errors/entity-not-found";

@Catch(EntityNotFoundError)
export class EntityNotFoundErrorFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.BAD_REQUEST;

    response
      .status(status)
      .json({
        name: 'EntityNotFoundError',
        message: exception.message
      });
  }
}