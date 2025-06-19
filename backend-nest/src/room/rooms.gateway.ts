import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RoomsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 방 별 플레이어 닉네임 저장
  private roomPlayers = new Map<
    string,
    { clientId: string; userId: string; nickname: string }[]
  >();

  afterInit(server: Server) {
    console.log('WebSocket 서버 초기화됨');
  }

  handleConnection(client: Socket) {
    console.log(`클라이언트 연결됨: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`클라이언트 연결 해제: ${client.id}`);

    // 연결 끊긴 클라이언트가 속한 방들에서 제거
    for (const [roomId, players] of this.roomPlayers) {
      const newPlayers = players.filter(p => p.clientId !== client.id);
      if (newPlayers.length !== players.length) {
        this.roomPlayers.set(roomId, newPlayers);
        // 업데이트된 플레이어 목록 방에 전송
        this.server.to(roomId).emit('roomPlayers', newPlayers.map(p => p.nickname));  // 여기 수정됨!
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; nickname: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, nickname } = data;

    client.join(roomId);
    const players = this.roomPlayers.get(roomId) || [];
    players.push({ clientId: client.id, userId, nickname });
    this.roomPlayers.set(roomId, players);

    this.server.to(roomId).emit('roomMessage', `${nickname}님이 방에 입장했습니다.`);
    this.server.to(roomId).emit('roomPlayers', players.map(p => p.nickname)); // 닉네임 배열로 통일
  }
}
