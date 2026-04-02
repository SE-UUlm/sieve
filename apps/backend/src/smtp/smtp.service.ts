import {
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Transporter } from "nodemailer";
import * as nodemailer from "nodemailer";

@Injectable()
export class SmtpService implements OnModuleInit {
    private transporter!: Transporter;
    private from!: string;

    constructor(private configService: ConfigService<null, true>) {}

    /**
     * Initializes the nodemailer transporter with SMTP credentials from config.
     */
    onModuleInit() {
        const host = this.configService.get<string>("SMTP_HOST");
        const port = this.configService.get<number>("SMTP_PORT");
        const user = this.configService.get<string>("SMTP_USER");
        const pass = this.configService.get<string>("SMTP_PASS");
        this.from = this.configService.get<string>("SMTP_FROM");

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });

        Logger.log("SMTP module initialized");
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
        try {
            Logger.log(`Sending email to ${recipient}...`);

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
