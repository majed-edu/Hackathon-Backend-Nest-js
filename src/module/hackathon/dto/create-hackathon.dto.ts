import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinDate,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateHackathonDto {
  @ApiProperty({ minLength: 3, example: 'NestJS Innovation Hackathon' })
  @IsString()
  @MinLength(3, { message: 'name must be at least 3 characters' })
  name: string;

  @ApiPropertyOptional({
    minLength: 10,
    maxLength: 1000,
    example: 'A complete NestJS and Prisma hackathon event.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'description must be at least 10 characters',
  })
  @MaxLength(1000, {
    message: 'description must not exceed 1000 characters',
  })
  description?: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-12-01T10:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate({ message: 'startsAt must be a valid date' })
  @MinDate(() => new Date(), { message: 'startsAt must be a future date' })
  startsAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-12-03T18:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate({ message: 'endsAt must be a valid date' })
  @MinDate(() => new Date(), { message: 'endsAt must be a future date' })
  endsAt: Date;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    minimum: 1,
    nullable: true,
    example: 100,
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  maxParticipants?: number | null;
}
