import {
  Body,
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SkipAuth } from './decorators/skipAuth.decorator';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetUpdateDto } from './dto/password-reset-update.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() signInDto: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const [accessToken, refreshToken] = await this.authService.signIn(
      signInDto.username,
      signInDto.password,
      '15m',
      '7d',
    );
    res
      .cookie('access_token', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        expires: new Date(Date.now() + 60000 * 60 * 24),
      })
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        expires: new Date(Date.now() + 60000 * 60 * 24 * 7),
      })
      .send({
        status: 'Login successful',
      });
  }

  @Post('refresh')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res) {
    if (!req.cookies.refresh_token) {
      return {
        message: 'Refresh token not found',
      };
    }

    if (!req.user) {
      return {
        message: 'User not found',
      };
    }

    const [newAccessToken, newRefreshToken] =
      await this.authService.refreshToken(
        req.cookies.refresh_token,
        req.user.sub,
        req.user.userType,
      );
    // SET { secure: true } in production for the below cookies
    res
      .cookie('access_token', newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        expires: new Date(Date.now() + 60000 * 60 * 24),
      })
      .cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        expires: new Date(Date.now() + 60000 * 60 * 24 * 7),
      })
      .send({
        status: `Token refresh successful - Woooooo!`,
      });
  }

  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    if (!req.user) {
      return {
        message: 'User not found',
      };
    }
    await this.authService.clearRefreshToken(req.user.sub);
    res
      .clearCookie('access_token')
      .clearCookie('refresh_token')
      .send({
        status: `User ${req.user.username} logged out successfully`,
      });
  }

  @SkipAuth()
  @Post('reset_password/request')
  async sendPasswordResetUrl(
    @Body() resetPasswordDto: PasswordResetRequestDto,
  ) {
    return await this.authService.sendPasswordResetUrl(resetPasswordDto);
  }

  @SkipAuth()
  @Get('reset_password/reset')
  async resetPassword(@Res({ passthrough: true }) res, @Query() query: any) {
    if (!query.jwt && query.token) {
      return { message: 'invalid url' };
    }
    return this.authService.acceptPasswordResetUrl(query.jwt, query.token);
  }

  // REMOVE SKIPAUTH WHEN COMPLETED!!!
  @SkipAuth()
  @Post('reset_password/reset')
  async updateUserPassword(@Body() body: PasswordResetUpdateDto, @Res() res) {
    const successfulUpdate = await this.authService.updateUserPassword(
      body.newPassword,
      body.newPasswordRepeated,
    );
    res.clearCookie('access_token').clearCookie('refresh_token');
    debugger;
    if (!successfulUpdate) {
      return res.send({ status: `YOU FUCKED UP!!` });
    } else {
      res.send({
        status: `Password successfully changed, Please log in again with your new password`,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
