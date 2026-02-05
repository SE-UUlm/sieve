import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service";

@Module({
  imports: [ConfigModule],
  exports: [PrismaService],
  providers: [PrismaService],
})
export class PrismaModule {}
