import { Type } from 'class-transformer';
import { ValidateNested, IsString, IsNumber, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

class CreateInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  issPercent?: number;   // ← aceita ISS
}

export class CreateInvoiceDto {
  @IsNumber()
  clientId: number;

  @IsOptional()
  @IsString()
  status?: string;       // ← aceita status (Pendente, Pago, etc.)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}