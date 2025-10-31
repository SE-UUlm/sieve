import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    findOne(options: { id: number } | { email: string }): Promise<User | null> {
        return this.usersRepository.findOneBy(options);
    }

    async remove(options: { id: number } | { email: string }): Promise<void> {
        await this.usersRepository.delete(options);
    }
}
