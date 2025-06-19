import { Controller, Post, Body, Res, HttpStatus, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: any) {
    try {
      const result = await this.authService.register(registerDto);
      // AuthService에서 이미 토큰과 사용자 정보를 반환하므로,
      // 여기서 201 Created 상태와 함께 그 결과(result)를 반환합니다.
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).json({ message: error.getResponse() });
      }
      console.error('회원가입 처리 중 예상치 못한 오류:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: '회원가입 처리 중 알 수 없는 오류가 발생했습니다.' });
    }
  }

  // login 메서드는 이전 단계에서 수정한 그대로 유지
  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }, @Res() res: any) {
    try {
      const result = await this.authService.login(loginDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).json({ message: error.getResponse() });
      }
      console.error('로그인 처리 중 예상치 못한 오류:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: '로그인 처리 중 알 수 없는 오류가 발생했습니다.' });
    }
  }
}