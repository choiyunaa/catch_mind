export class CreateRoomDto {
  title: string;
  maxPlayers: number;
  isPrivate: boolean;
  userId: string;    // 방 생성자 ID
  nickname: string;  // 생성자 닉네임
}
