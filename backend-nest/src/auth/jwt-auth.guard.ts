import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // decoded 내부의 sub 필드를 userId로 매핑하여 request.user에 할당
      request.user = {
        userId: decoded.sub,
        username: decoded.username,
        // 필요하면 추가 필드도 명시 가능
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
