import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateGallerypostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // userId는 서버에서 주입하므로 Optional
  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  createdAt?: string;
}

