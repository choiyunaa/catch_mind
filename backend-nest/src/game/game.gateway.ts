import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({ cors: true }) // cors 설정은 상황에 맞게 조정
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 플레이어 목록에서 제거 등 필요한 작업
    this.gameService.removePlayer(client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; nickname: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    this.gameService.setRoomId(data.roomId);
    this.gameService.setIo(this.server);
    this.gameService.addPlayer({
      userId: client.id, // socket.id를 userId로 쓸 수도 있고, 실제 유저 아이디면 data.userId
      nickname: data.nickname,
    });
    console.log(`${data.nickname} joined room ${data.roomId}`);
    this.server.to(data.roomId).emit('roomUpdate', {
      players: this.gameService['players'], // 임시로 접근, 필요하면 getter 추가
    });
  }

  @SubscribeMessage('startGame')
  handleStartGame(
    @MessageBody() data: { roomId: string },
  ) {
    this.gameService.setRoomId(data.roomId);
    this.gameService.setIo(this.server);
    this.gameService.startGame();
  }
}
