import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../room/rooms.service';

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  afterInit(server: Server) {
    this.roomsService.setIo(server);
  }

  handleConnection(client: Socket) {
    console.log(`Game Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Game Client disconnected: ${client.id}`);
    const roomId = this.roomsService.removeUserFromRoom(client.id);
    if (roomId) {
      const players = this.roomsService.getPlayersInRoom(roomId);
      this.server.to(roomId).emit('room:players', players);
      this.emitRoomListUpdate();
    }
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; nickname: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, nickname } = data;
    this.roomsService.addUserToRoom(roomId, userId, nickname, client.id);
    client.join(roomId);

    const players = this.roomsService.getPlayersInRoom(roomId);
    this.server.to(roomId).emit('room:players', players);
    this.emitRoomListUpdate();
  }

  @SubscribeMessage('startGame')
  handleStartGame(@MessageBody() data: { roomId: string; round: number }) {
    this.roomsService.startGame(data.roomId, data.round);
    this.emitRoomListUpdate();
  }

  @SubscribeMessage('chat')
  handleChat(
    @MessageBody() data: { roomId: string; userId: string; message: string },
  ) {
    const { roomId, userId, message } = data;
    this.server.to(roomId).emit('chat', { userId, message });

    const answer = this.roomsService.getCurrentWord(roomId);
    if (message === answer) {
      this.roomsService.handleCorrectAnswer(roomId, userId);
    }
  }
  
  @SubscribeMessage('draw')
  handleDraw(
    @MessageBody() data: { roomId: string; data: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(data.roomId).emit('draw', data.data);
  }

  private async emitRoomListUpdate() {
    const rooms = await this.roomsService.findPublicRooms();
    this.server.emit('roomList', rooms);
  }
}
