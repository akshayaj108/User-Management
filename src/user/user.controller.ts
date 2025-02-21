import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/auth.jwt.guard';
import { RoleGuard } from 'src/auth/roles.guards';
import { Roles } from 'src/auth/role.decorator';
import { UserRole } from './entity/user.entities';
import { CreateUserDto } from './dto/create.user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateRoleDto } from './dto/update.role.dto';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async register(@Body() body: CreateUserDto) {
    return this.userService.createUser(
      body.email,
      body.password,
      UserRole.USER,
    );
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Patch('/:id/role')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role - User/Admin)' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateUserRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    const formattedRole = body.role.trim().toLowerCase();

    const roleMapping = {
      admin: UserRole.ADMIN,
      user: UserRole.USER,
    };

    if (!(formattedRole in roleMapping)) {
      return { message: 'Role must be either USER or ADMIN' };
    }
    return this.userService.updateUserRole(parseInt(id, 10), body.role);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/:id/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deactivateActiveStatus(@Param('id') id: string) {
    return this.userService.deactivateUser(Number(id));
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/:id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async activateActiveStatus(@Param('id') id: string) {
    return this.userService.activateUser(Number(id));
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get('details')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user details by email (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getData(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in user profile' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.userService.getDetail(req.user.sub);
  }
}
