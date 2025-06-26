
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  emitRoomListUpdate() {
    this.server.emit('roomList', null);
  }
}

