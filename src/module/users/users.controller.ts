import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { PublicUserDto } from '../../common/dtos/api-response.dto.js';

@ApiTags('Users')
@ApiCookieAuth('better-auth-cookie')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns all users. Admin only.
   */
  @Get('all')
  @Roles(['admin'])
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiOkResponse({
    description: 'All public user records returned',
    type: PublicUserDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Current user is not an admin' })
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Returns a single user by ID. Throws 404 if not found.
   * Any authenticated user can look up a user by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID (authenticated)' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiOkResponse({ description: 'Public user record returned', type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
