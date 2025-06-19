import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum RoomStatus {
  Waiting = 'waiting',
  Playing = 'playing',
  Finished = 'finished',
}

@Schema()
export class Room extends Document {
  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ required: true })
  maxPlayers: number;

  @Prop({
    type: [
      {
        userId: { type: String, required: true },
        nickname: { type: String, required: true },
        isHost: { type: Boolean, default: false },
        score: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  players: {
    userId: string;
    nickname: string;
    isHost: boolean;
    score: number;
  }[];

  @Prop({ default: RoomStatus.Waiting, enum: RoomStatus })
  status: RoomStatus;

  @Prop({ default: 0 })
  currentRound: number;

  @Prop({ default: 3 })
  maxRounds: number;

  @Prop({ default: null })
  currentDrawer: string | null;

  @Prop({ default: null })
  currentWord: string | null;

  @Prop({ type: Date, default: null })
  startTime: Date | null;

  @Prop({ type: Date, default: null })
  endTime: Date | null;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

export type RoomDocument = Room & Document;
