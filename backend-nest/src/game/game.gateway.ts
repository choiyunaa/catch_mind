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

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  afterInit(server: Server) {
    this.gameService.setIo(server);
  }

  handleConnection(client: Socket) {
    // 필요하면 연결 시 처리
  }

  handleDisconnect(client: Socket) {
    const removed = this.gameService.removePlayerByClientId(client.id);
    if (removed) {
      const players = this.gameService.getPlayers(removed.roomId);
      this.server.to(removed.roomId).emit('room:players', players);
      this.emitRoomListUpdate();
    }
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; nickname: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, nickname } = data;
    this.gameService.addPlayer(roomId, { clientId: client.id, userId, nickname });
    client.join(roomId);

    const players = this.gameService.getPlayers(roomId);
    this.server.to(roomId).emit('room:players', players);
    this.emitRoomListUpdate();
  }

  @SubscribeMessage('startGame')
  handleStartGame(@MessageBody() data: { roomId: string; round: number }) {
    this.gameService.startGame(data.roomId, data.round);
    this.emitRoomListUpdate();
  }

  @SubscribeMessage('chat')
  handleChat(
    @MessageBody() data: { roomId: string; userId: string; message: string },
  ) {
    const { roomId, userId, message } = data;
    this.server.to(roomId).emit('chat', { userId, message });

    const currentWord = this.gameService.getCurrentWord(roomId);
    const drawer = this.gameService.getPlayers(roomId).find(p => p.isHost);

    if (message === currentWord && userId !== drawer?.userId) {
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

  private async emitRoomListUpdate() {
    // 필요 시 roomsService 등을 활용하여 방 목록 업데이트
    this.server.emit('roomList', []);
  }
}
