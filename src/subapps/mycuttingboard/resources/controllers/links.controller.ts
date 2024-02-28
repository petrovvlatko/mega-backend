import { Controller, Get } from '@nestjs/common';
import { LinksService } from '../services/links.service';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get('')
  async findAll() {
    return await this.linksService.getMessage();
  }
}
