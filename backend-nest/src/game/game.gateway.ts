import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
  console.log(`Game Client connected: ${client.id}`);
}

  handleDisconnect(client: Socket) {
    console.log(`Game Client disconnected: ${client.id}`);
    const result = this.gameService.removePlayerByClientId(client.id);
    if (result) {
      const { roomId } = result;
      const players = this.gameService.getPlayers(roomId);
      this.server.to(roomId).emit('room:players', players);
    }
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; nickname: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, nickname } = data;
    client.join(roomId);
    this.gameService.addPlayer(roomId, { clientId: client.id, userId, nickname });
    const players = this.gameService.getPlayers(roomId);
    this.server.to(roomId).emit('room:players', players);
  }

  @SubscribeMessage('startGame')
handleStartGame(
  @MessageBody() data: { roomId: string; round: number },
  @ConnectedSocket() client: Socket,
) {
  this.gameService.setIo(this.server);
  this.gameService.startGame(data.roomId, data.round);
}


  @SubscribeMessage('chat')
  handleChat(
    @MessageBody() data: { roomId: string; userId: string; message: string },
  ) {
    const { roomId, userId, message } = data;
    this.server.to(roomId).emit('chat', { userId, message });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.roomId);
    const result = this.gameService.removePlayerByClientId(client.id);
    if (result) {
      const players = this.gameService.getPlayers(data.roomId);
      this.server.to(data.roomId).emit('room:players', players);
    }
  }
  @SubscribeMessage('draw')
handleDraw(
  @MessageBody() data: { roomId: string; data: any },
  @ConnectedSocket() client: Socket,
) {
  // 다른 사람들에게 전달
  client.broadcast.to(data.roomId).emit('draw', data.data);
}
}
