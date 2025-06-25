import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';  // 추가
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from './schemas/user.schema';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,  // 추가: 환경변수 사용을 위한 ConfigModule
    JwtModule.registerAsync({  // 변경: 비동기 설정으로 ConfigService 사용
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret_key',
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION') || '3600s' },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),  // user 모델 등록
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
