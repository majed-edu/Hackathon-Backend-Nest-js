import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

interface ValidationErrorResponse {
  property: string;
  message: string;
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentProperty?: string,
): ValidationErrorResponse[] {
  return errors.flatMap((error) => {
    const property = parentProperty
      ? `${parentProperty}.${error.property}`
      : error.property;

    const messages = Object.values(error.constraints ?? {}).map((message) => ({
      property,
      message,
    }));

    return [
      ...messages,
      ...flattenValidationErrors(error.children ?? [], property),
    ];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException(flattenValidationErrors(errors)),
  });
}
