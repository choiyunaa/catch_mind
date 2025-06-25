// src/lookdraw/lookdraw.controller.ts
import { Controller, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { LookDrawService } from './lookdraw.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('lookdraw')
export class LookDrawController {
  constructor(private readonly lookDrawService: LookDrawService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':roomId')
  async getDrawings(@Param('roomId') roomId: string, @Req() req) {
    const userId = req.user.id;
    const hasAccess = await this.lookDrawService.verifyUserInRoom(roomId, userId);

    if (!hasAccess) {
      throw new ForbiddenException('이 방에 접근할 수 없습니다.');
    }

    const drawings = await this.lookDrawService.getRoomDrawings(roomId);
    return { drawings }; // base64 string[] or URL[]
  }
}
