import { PartialType } from '@nestjs/mapped-types';
import { ApiExtraModels } from '@nestjs/swagger';
import { CreateHackathonDto } from './create-hackathon.dto.js';

@ApiExtraModels(CreateHackathonDto)
export class UpdateHackathonDto extends PartialType(CreateHackathonDto) {}
