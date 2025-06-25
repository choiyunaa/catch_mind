// types/custom-request.d.ts
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  username: string;
  nickname: string;
  iat?: number;
  exp?: number;
}

export interface CustomRequest extends Request {
  user: JwtPayload;
}
