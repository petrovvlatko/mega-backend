import { Module } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/users.entity';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './authentication/guards/access-token/access-token.guard';
import { AuthenticationGuard } from './authentication/guards/authentication/authentication.guard';
import { RefreshTokens } from './authentication/refresh-token-ids/refresh-tokens.entity';
import { RefreshTokensService } from './authentication/refresh-token-ids/refresh-tokens.service';

@Module({
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    AccessTokenGuard,
    AuthenticationService,
    RefreshTokensService,
  ],
  imports: [
    TypeOrmModule.forFeature([Users, RefreshTokens]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  exports: [],
  controllers: [AuthenticationController],
})
export class IamModule {}
