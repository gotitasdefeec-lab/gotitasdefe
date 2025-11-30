import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  images?: string[];
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minStock?: number;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;


  @ApiProperty({ required: false, default: 'active' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateProductDto {
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  images?: string[];
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minStock?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;


  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
