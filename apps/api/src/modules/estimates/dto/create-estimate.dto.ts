// apps/api/src/modules/estimates/dto/create-estimate.dto.ts
import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateEstimateItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()                    // ✅ TORNA QUANTIDADE OPCIONAL
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  issPercent?: number;
}

export class CreateEstimateDto {
  @Type(() => Number)
  @IsNumber()
  clientId: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEstimateItemDto)
  items: CreateEstimateItemDto[];
}