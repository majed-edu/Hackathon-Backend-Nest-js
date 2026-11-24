import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

export const ResponseMessage = (message = 'success') =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
