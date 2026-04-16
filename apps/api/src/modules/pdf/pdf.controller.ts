import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
@Controller('pdf')
export class PdfController {
  @Get(':filename')
  async getPdf(@Param('filename') filename: string, @Res() res: Response) {
    // Caminho correto para os PDFs
    const pdfPath = path.join(process.cwd(), 'uploads', 'pdfs', filename);
    console.log(`?? Procurando PDF: ${pdfPath}`);
    if (fs.existsSync(pdfPath)) {
      console.log(`? PDF encontrado: ${filename}`);
      const stat = fs.statSync(pdfPath);
      console.log(`?? Tamanho: ${stat.size} bytes`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);
      return;
    }
    console.log(`? PDF não encontrado: ${pdfPath}`);
    throw new NotFoundException(`Arquivo ${filename} não encontrado`);
  }
}
