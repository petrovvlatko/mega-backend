import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { GeneratePasswordResetUrlDto } from './dto/password-reset-url.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
    accessTokenexpiration: string,
    refreshTokenExpiration: string,
  ) {
    const user = await this.usersService.findOneByUsername(username);
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    const payload = {
      sub: user.userId,
      username: user.username,
      userType: user.userType,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({
        ...payload,
        expiresIn: accessTokenexpiration,
      }),
      this.jwtService.signAsync({
        ...payload,
        expiresIn: refreshTokenExpiration,
      }),
    ]);

    const salt = bcrypt.genSaltSync(parseInt(process.env.SALT_ROUNDS));
    const encryptedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.usersService.update(
      user.userId,
      {
        refreshToken: encryptedRefreshToken,
      },
      true,
    );

    return [accessToken, refreshToken];
  }

  async refreshToken(
    currentRefreshToken: string,
    userId: number,
    userType: string,
    accessTokenexpiration: string = '15m',
    refreshTokenExpiration: string = '7d',
  ) {
    const user = await this.usersService.findOneById(userId, userType);
    const isMatch = await bcrypt.compare(
      currentRefreshToken,
      user.refreshToken,
    );
    if (!isMatch) {
      throw new UnauthorizedException(
        'Access Denied --> Please try your login again',
      );
    }
    const payload = {
      sub: user.userId,
      username: user.username,
      userType: user.userType,
    };
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync({
        ...payload,
        expiresIn: accessTokenexpiration,
      }),
      this.jwtService.signAsync({
        ...payload,
        expiresIn: refreshTokenExpiration,
      }),
    ]);
    const salt = bcrypt.genSaltSync(parseInt(process.env.SALT_ROUNDS));
    const encryptedRefreshToken = await bcrypt.hash(newRefreshToken, salt);
    await this.usersService.update(
      user.userId,
      {
        refreshToken: encryptedRefreshToken,
      },
      true,
    );

    return [newAccessToken, newRefreshToken];
  }

  clearRefreshToken = async (userId) => {
    await this.usersService.update(
      userId,
      {
        refreshToken: null,
      },
      true,
    );
    return true;
  };

  generatePasswordResetUrl = async (
    passwordResetUrlDto: GeneratePasswordResetUrlDto,
  ) => {
    const userEmailToReset = passwordResetUrlDto.email;
    const resetMessage = `If user with email ${userEmailToReset} exists, a password reset link will be sent`;

    const user = await this.usersService.findOneByEmail(userEmailToReset);
    // FUTURE FEATURE - save invalid emails to a table along with timestamps and ip address\
    if (!user) {
      return {
        message: resetMessage,
      };
    }

    const payload = {
      sub: user.userId,
      username: user.username,
      userType: user.userType,
    };

    const passwordResetToken = await this.jwtService.signAsync({
      ...payload,
      expiresIn: new Date(Date.now() + 60000 * 5),
    });

    const salt = bcrypt.genSaltSync(parseInt(process.env.SALT_ROUNDS));
    const encryptedPasswordResetToken = await bcrypt.hash(
      passwordResetToken,
      salt,
    );

    await this.usersService.update(
      user.userId,
      {
        passwordResetToken: encryptedPasswordResetToken,
      },
      true,
    );

    const passwordResetUrl = `http://localhost:3000/auth/reset-password?token=${passwordResetToken}`;

    // console.log(passwordResetUrl);
    // debugger;

    // Instead of setting the token in the url, set it as an http only cookie!!
    // - FIRST clear all cookies
    // - THEN set a new cookie for password_reset

    // 4 - Email password reset link to user
    // 5 - When user creates a new password successfully:
    //     - Persist a new encrtypted password to the database
    //     - Delete the password reset link

    // REMOVE passwordResetUrl AFTER TESTING
    return {
      message: resetMessage,
      passwordResetUrl: passwordResetUrl,
    };
  };
}
