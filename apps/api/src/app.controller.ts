@Controller('teste')
export class AppController {
  @Get()
  getHello() {
    return { status: 'OK FUNCIONANDO 🚀' };
  }
}
