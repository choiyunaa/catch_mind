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
import { GameService } from './game.service';
import { RoomsService } from '../room/rooms.service';

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly roomsService: RoomsService,
  ) {}

  afterInit(server: Server) {
    this.gameService.setIo(server);
  }

  handleConnection(client: Socket) {
    // 연결 시 필요한 로직 있으면 작성
  }

  handleDisconnect(client: Socket) {
    const removedRoomId = this.roomsService.removeUserFromRoom(client.id);
    if (removedRoomId) {
      const players = this.roomsService.getPlayersInRoom(removedRoomId);
      this.server.to(removedRoomId).emit('room:players', players);
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
    this.gameService.startGame(data.roomId, data.round);
    this.emitRoomListUpdate();
  }

  // public 메서드 호출하도록 바꿔야 하니 이름 맞춤
  @SubscribeMessage('startNextRound')
  handleStartNextRound(@MessageBody() data: { roomId: string }) {
    this.gameService.startNextRound(data.roomId);
    this.emitRoomListUpdate();
  }

  @SubscribeMessage('chat')
  handleChat(
    @MessageBody() data: { roomId: string; userId: string; message: string },
  ) {
    const { roomId, userId, message } = data;
    this.server.to(roomId).emit('chat', { userId, message });

    const currentWord = this.gameService.getCurrentWord(roomId);
    const drawerUserId = this.gameService.getDrawerUserId(roomId);

    if (message === currentWord && userId !== drawerUserId) {
      this.gameService.handleCorrectAnswer(roomId, userId);
    }
  }

  @SubscribeMessage('draw')
  handleDraw(
    @MessageBody() data: { roomId: string; data: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(data.roomId).emit('draw', data.data);
  }

  @SubscribeMessage('room:reset')
  handleRoomReset(@MessageBody() data: { roomId: string }) {
    this.gameService.resetRoom(data.roomId);
    this.emitRoomListUpdate();
  }

  private async emitRoomListUpdate() {
    this.server.emit('roomList', []);
  }
}
