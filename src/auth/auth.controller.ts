import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { ForgotPassDto } from 'src/user/dto/forgot.password.dto';
import { ResetPasswordDto } from 'src/user/dto/reset.password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: CreateUserDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('verify/:token')
  @ApiOperation({ summary: 'Verify user account' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async verify(@Param('token') token: string) {
    return this.userService.verifyUser(token);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({ status: 200, description: 'Reset link sent to email' })
  @ApiResponse({ status: 400, description: 'User not found' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPassDto) {
    return this.userService.requestForResetPassword(forgotPasswordDto.email);
  }

  @Post('reset-password/:token')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetUserPassword(
    @Param('token') token: string,
    @Body() body: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(token, body.newPassword);
  }
}
