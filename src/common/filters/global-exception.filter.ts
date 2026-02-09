import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionRes: any = exception.getResponse();

      message = exceptionRes?.message || exception.message;
    }

    res.json({
      success: false,
      message: message,
      data: null,
      statusCode: status,
    });
  }
}
