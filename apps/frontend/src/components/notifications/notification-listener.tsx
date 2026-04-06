"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { showSuccessToast } from "@/lib/toast";

export function NotificationListener() {
    useEffect(() => {
        // Connect to WebSocket server
        const socket = io("http://localhost:5175/notifications", {
            withCredentials: true,
        });

        socket.on("connect", () => {
            console.log("Connected to notifications WebSocket");
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from notifications WebSocket");
        });

        socket.on(
            "notification",
            (data: {
                type: string;
                data: { emailId: string; subject: string | null };
            }) => {
                if (data.type === "NEW_IMAP_EMAIL") {
                    showSuccessToast({
                        title: "New Email Received",
                        description: `A new email "${data.data.subject || "(no subject)"}" has been processed from IMAP.`,
                    });
                }
            },
        );

        return () => {
            socket.disconnect();
        };
    }, []);

    return null;
}
