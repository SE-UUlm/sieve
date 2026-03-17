import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { NewImapEmailEvent } from "../imap/imap-poller.service";

@WebSocketGateway({
    namespace: "notifications",
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private readonly connectedClients = new Map<string, Socket>();

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @OnEvent("imap.email.received")
    handleNewImapEmail(event: NewImapEmailEvent) {
        this.logger.log(`Broadcasting new IMAP email notification: ${event.subject || "(no subject)"}`);
        
        this.server.emit("notification", {
            type: "NEW_IMAP_EMAIL",
            data: {
                emailId: event.emailId,
                subject: event.subject,
            },
        });
    }
}
