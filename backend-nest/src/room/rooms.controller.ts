import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
