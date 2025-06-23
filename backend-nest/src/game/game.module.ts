import { Module, forwardRef } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { RoomsModule } from '../room/rooms.module';

@Module({
  imports: [forwardRef(() => RoomsModule)],
  providers: [GameGateway, GameService],
  exports: [GameService],
})
export class GameModule {}
