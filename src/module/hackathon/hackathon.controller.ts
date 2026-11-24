import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';
import { HackathonQueryDto } from './dto/hackathon-query.dto.js';
import { HackathonService } from './hackathon.service.js';
import {
  HackathonResponseDto,
  PaginatedHackathonsDto,
  ParticipantDto,
} from '../../common/dtos/api-response.dto.js';

@ApiTags('Hackathons')
@ApiCookieAuth('better-auth-cookie')
@Controller('hackathon')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) {}

  @Post()
  @Roles(['admin'])
  @ResponseMessage('Hackathon created successfully')
  @ApiOperation({ summary: 'Create a Hackathon (admin only)' })
  @ApiBody({ type: CreateHackathonDto })
  @ApiCreatedResponse({
    description: 'Hackathon created successfully',
    type: HackathonResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body or date range' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Current user is not an admin' })
  create(
    @Body() dto: CreateHackathonDto,
    @Session() session: UserSession,
  ) {
    return this.hackathonService.create(dto, session.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List Hackathons with optional search, filters, and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, enum: ['upcoming', 'ongoing', 'completed'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({
    description: 'Paginated Hackathon records with participantsCount and dynamic status',
    type: PaginatedHackathonsDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiBadRequestResponse({ description: 'Invalid query parameter value' })
  findAll(@Query() query: HackathonQueryDto) {
    return this.hackathonService.findAll(query);
  }

  @Get('my')
  @ResponseMessage('My joined hackathons')
  @ApiOperation({ summary: 'List Hackathons joined by the current participant' })
  @ApiOkResponse({
    description: 'Current user participation records expanded with Hackathon data',
    type: HackathonResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  myHackathons(@Session() session: UserSession) {
    return this.hackathonService.findMyHackathons(session.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Hackathon by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Hackathon ID' })
  @ApiOkResponse({
    description: 'Hackathon returned with participantsCount and status',
    type: HackathonResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiNotFoundResponse({ description: 'Hackathon not found' })
  findOne(@Param('id') id: string) {
    return this.hackathonService.findOne(id);
  }

  @Patch(':id')
  @Roles(['admin'])
  @ResponseMessage('Hackathon updated successfully')
  @ApiOperation({ summary: 'Update a Hackathon (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonDto })
  @ApiOkResponse({
    description: 'Hackathon updated successfully',
    type: HackathonResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body or date range' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Current user is not an admin' })
  @ApiNotFoundResponse({ description: 'Hackathon not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonDto,
  ) {
    return this.hackathonService.update(id, dto);
  }

  @Post(':id/join')
  @Roles(['participant'])
  @ResponseMessage('Successfully joined hackathon')
  @ApiOperation({ summary: 'Join a Hackathon (participant only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Hackathon ID' })
  @ApiOkResponse({ description: 'Hackathon participation record created', type: ParticipantDto })
  @ApiBadRequestResponse({ description: 'Inactive, expired, duplicate, or full Hackathon' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Current user is not a participant' })
  @ApiNotFoundResponse({ description: 'Hackathon not found' })
  join(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.hackathonService.join(id, session.user.id);
  }

  @Delete(':id/leave')
  @Roles(['participant'])
  @ResponseMessage('Successfully left hackathon')
  @ApiOperation({ summary: 'Leave a joined Hackathon (participant only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Hackathon ID' })
  @ApiOkResponse({ description: 'Participation record deleted', type: ParticipantDto })
  @ApiBadRequestResponse({ description: 'User has not joined the Hackathon' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Current user is not a participant' })
  @ApiNotFoundResponse({ description: 'Hackathon not found' })
  leave(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.hackathonService.leave(id, session.user.id);
  }

  @Delete(':id')
  @Roles(['admin'])
  @ResponseMessage('Hackathon deleted successfully')
  @ApiOperation({ summary: 'Delete a Hackathon (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Hackathon ID' })
  @ApiOkResponse({ description: 'Hackathon deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Current user is not an admin' })
  @ApiNotFoundResponse({ description: 'Hackathon not found' })
  remove(@Param('id') id: string) {
    return this.hackathonService.remove(id);
  }
}
