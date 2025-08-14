import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Response } from 'express';
import { EntityAlreadyExistsError } from "@/infra/database/errors/entity-already-exists";

@Catch(EntityAlreadyExistsError)
export class EntityAlreadyExistsErrorFilter implements ExceptionFilter {
  catch(exception: EntityAlreadyExistsError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.BAD_REQUEST;

    response
      .status(status)
      .json({
        name: 'EntityAlreadyExistsError',
        message: exception.message
      });
  }
}