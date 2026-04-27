"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getImapControllerGetInboxEmailsQueryKey } from "@/lib/client/imap/imap";
import { getJobControllerGetHistoryQueryKey } from "@/lib/client/jobs/jobs";
import { showSuccessToast } from "@/lib/toast";

export function useNotifications() {
    const socketRef = useRef<Socket | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Connect to WebSocket server
        const socket = io(
            `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5175"}/notifications`,
            {
                withCredentials: true,
            },
        );

        socketRef.current = socket;

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
                    queryClient.invalidateQueries({
                        queryKey: getImapControllerGetInboxEmailsQueryKey(),
                    });
                    queryClient.invalidateQueries({
                        queryKey: getJobControllerGetHistoryQueryKey({
                            source: "IMAP",
                        }),
                    });
                    queryClient.invalidateQueries({
                        queryKey: getJobControllerGetHistoryQueryKey({}),
                    });
                }
            },
        );

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    return socketRef.current;
}
