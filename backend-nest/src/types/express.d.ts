import 'express';

declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      username: string;
      nickname: string;
      iat?: number;
      exp?: number;
    };
  }
}
