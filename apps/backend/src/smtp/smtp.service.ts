import {
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit,
    ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Transporter } from "nodemailer";
import * as nodemailer from "nodemailer";

@Injectable()
export class SmtpService implements OnModuleInit {
    private transporter?: Transporter;
    private from?: string;

    constructor(private configService: ConfigService) {}

    /**
     * Initializes the nodemailer transporter with SMTP credentials from config.
     */
    onModuleInit() {
        const host = this.configService.get<string>("SMTP_HOST");
        const port = this.configService.get<number>("SMTP_PORT");
        const user = this.configService.get<string>("SMTP_USER");
        const pass = this.configService.get<string>("SMTP_PASS");
        const from = this.configService.get<string>("SMTP_FROM");
        if (!host || !port || !from) {
            Logger.log("SMTP module disabled");
            return;
        }
        this.from = from;

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth:
                user !== undefined && pass !== undefined
                    ? { user, pass }
                    : undefined, // Only authenticate if username and password are provided
        });

        Logger.log("SMTP module initialized");
    }

    isConfigured(): boolean {
        return this.transporter !== undefined && this.from !== undefined;
    }

    /**
     * Sends an email via SMTP.
     *
     * @param recipient - The recipient's email address.
     * @param subject   - The email subject line.
     * @param body      - The plain-text body of the email.
     */
    async sendMail(
        recipient: string,
        subject: string,
        body: string,
    ): Promise<void> {
        Logger.log(`Sending email to ${recipient}...`);

        if (!this.transporter || !this.from) {
            throw new ServiceUnavailableException(
                `Email sending is not configured for this instance.`,
            );
        }
        try {
            await this.transporter.sendMail({
                from: this.from,
                to: recipient,
                subject,
                text: body,
            });

            Logger.log(`Email to ${recipient} sent successfully`);
        } catch (error) {
            Logger.error("Error sending email via SMTP:", error);
            throw new InternalServerErrorException(
                "Failed to send email via SMTP",
            );
        }
    }
}
