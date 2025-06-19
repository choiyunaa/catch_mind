import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { username, password, nickname } = registerDto;

      const existingUsername = await this.userModel.findOne({ username });
      if (existingUsername) {
        throw new HttpException('이미 존재하는 사용자 이름입니다.', HttpStatus.CONFLICT);
      }

      const existingNickname = await this.userModel.findOne({ nickname });
      if (existingNickname) {
        throw new HttpException('이미 존재하는 닉네임입니다.', HttpStatus.CONFLICT);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new this.userModel({ username, password: hashedPassword, nickname });

      await newUser.save();

      // **** 회원가입 성공 후 자동 로그인 처리 ****
      const payload = { username: newUser.username, sub: newUser._id };
      return {
        message: '회원가입 성공',
        username: newUser.username,
        nickname: newUser.nickname,
        access_token: this.jwtService.sign(payload), // JWT 토큰 반환
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('DB 저장 중 에러:', error);
      throw new HttpException('회원가입 중 데이터베이스 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // login 메서드는 이전 단계에서 수정한 그대로 유지
  async login(loginDto: { username: string; password: string }) {
    const { username, password } = loginDto;

    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new HttpException('아이디 또는 비밀번호가 올바르지 않습니다.', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new HttpException('아이디 또는 비밀번호가 올바르지 않습니다.', HttpStatus.UNAUTHORIZED);
    }

    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      nickname: user.nickname,
      username: user.username,
    };
  }
}