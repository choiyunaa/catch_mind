import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './schemas/room.schema';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('public')
  getPublicRooms(): Promise<Room[]> {
    return this.roomsService.findPublicRooms();
  }

  @Post()
  createRoom(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
    return this.roomsService.createRoom(createRoomDto);
  }

  @Post('quick-join')
  async quickJoin(@Body() body: { userId: string; nickname: string }): Promise<{ roomId: string }> {
    const room = await this.roomsService.findAvailableRoom();
    if (!room) {
      throw new BadRequestException('입장 가능한 방이 없습니다.');
    }
    // 빈 방에 유저 추가
    this.roomsService.addUserToRoom(room.roomId, body.userId, body.nickname, ''); // socketId는 프론트 소켓 이벤트에서 따로 처리하세요.
    return { roomId: room.roomId };
  }
}
