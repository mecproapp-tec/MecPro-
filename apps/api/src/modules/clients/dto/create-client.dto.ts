export class CreateClientDto {
  name: string;
  phone: string;
  vehicle?: string;
  plate?: string;
  document?: string;
  address?: string;
}