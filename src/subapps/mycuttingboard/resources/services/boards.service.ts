import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Boards } from '../../entities/mycuttingboardBoards.entity';
@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Boards)
    private boardsRepository: Repository<Boards>,
  ) {}

  async getBoardDataById(id: number) {
    const board = await this.boardsRepository.findOne({ where: { id } });
    if (!board) {
      throw new Error('Board not found');
    }
    return board;
  }
}
