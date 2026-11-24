import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorDto {
  @ApiProperty({ example: 'name' })
  property: string;

  @ApiProperty({ example: 'name must be at least 3 characters' })
  message: string;
}

export class BadRequestResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    description: 'Bad request message or validation error array',
    oneOf: [
      { type: 'string', example: 'Hackathon has ended' },
      {
        type: 'array',
        items: { $ref: '#/components/schemas/ValidationErrorDto' },
      },
    ],
  })
  message: string | ValidationErrorDto[];

  @ApiProperty({ example: null, nullable: true })
  error?: string;
}

export class PublicUserDto {
  @ApiProperty({ example: 'user-id' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Test User' })
  name: string;

  @ApiProperty({ example: 'participant' })
  role: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class AuthorDto {
  @ApiProperty({ example: 'user-id' })
  id: string;

  @ApiProperty({ example: 'Test User' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;
}

export class ParticipantDto {
  @ApiProperty({ example: 'participant-record-id' })
  id: string;

  @ApiProperty({ example: 'hackathon-id' })
  hackathonId: string;

  @ApiProperty({ example: 'user-id' })
  userId: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class HackathonResponseDto {
  @ApiProperty({ example: 'hackathon-id' })
  id: string;

  @ApiProperty({ example: 'NestJS Hackathon' })
  name: string;

  @ApiProperty({ nullable: true, example: 'A NestJS and Prisma event.' })
  description: string | null;

  @ApiProperty({ format: 'date-time' })
  startDate: Date;

  @ApiProperty({ format: 'date-time' })
  endDate: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ nullable: true, minimum: 1, example: 100 })
  maxParticipants: number | null;

  @ApiProperty({ example: 'author-id' })
  authorId: string;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty({ example: 12 })
  participantsCount: number;

  @ApiProperty({ enum: ['upcoming', 'ongoing', 'completed'], example: 'upcoming' })
  status: 'upcoming' | 'ongoing' | 'completed';

  @ApiProperty({ type: [ParticipantDto] })
  participants: ParticipantDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class PaginatedHackathonsDto {
  @ApiProperty({ type: [HackathonResponseDto] })
  records: HackathonResponseDto[];

  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class SuccessEnvelopeDto<T = unknown> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'success' })
  message: string;

  @ApiProperty({ required: false })
  data: T;
}
