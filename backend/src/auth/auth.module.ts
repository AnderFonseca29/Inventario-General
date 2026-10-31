import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmpresasModule } from '../empresas/empresas.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { TokensPurgaService } from './tokens-purga.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), EmpresasModule],
  controllers: [AuthController],
  providers: [AuthService, CaptchaService, JwtStrategy, TokensPurgaService],
  exports: [AuthService],
})
export class AuthModule {}
