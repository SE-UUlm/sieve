"use client";
import React, { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils/shadcn-helper";

const MIN_PANE_WIDTH_PX = 300;

type SplitViewProps = {
    children: React.ReactNode;
    className?: string;
    /** Initial split ratio for the left pane (0–1). Default: 0.5 */
    defaultSplit?: number;
    /** Whether the split can be dragged to resize. Default: true */
    resizable?: boolean;
};

export function SplitView({
    children,
    className = "",
    defaultSplit = 0.5,
    resizable = false,
}: SplitViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [split, setSplit] = useState(defaultSplit);
    const isDragging = useRef(false);

    const clampRatio = useCallback((ratio: number, containerWidth: number) => {
        const minRatio = MIN_PANE_WIDTH_PX / containerWidth;
        const maxRatio = 1 - minRatio;
        return Math.min(maxRatio, Math.max(minRatio, ratio));
    }, []);

    const startDrag = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            isDragging.current = true;

            const onMove = (ev: MouseEvent | TouchEvent) => {
                if (!isDragging.current || !containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const clientX =
                    "touches" in ev ? ev.touches[0].clientX : ev.clientX;
                const ratio = (clientX - rect.left) / rect.width;
                setSplit(clampRatio(ratio, rect.width));
            };

            const onUp = () => {
                isDragging.current = false;
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.removeEventListener("touchmove", onMove);
                document.removeEventListener("touchend", onUp);
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
            document.addEventListener("touchmove", onMove);
            document.addEventListener("touchend", onUp);
        },
        [clampRatio],
    );

    const childArray = React.Children.toArray(children);

    return (
        <div
            ref={containerRef}
            className={cn(
                "flex w-full flex-col overflow-y-auto transition-colors duration-300 lg:h-full lg:flex-row lg:overflow-hidden",
                className,
            )}
        >
            {/* Left pane */}
            <div
                className="flex min-w-0 lg:h-full lg:overflow-y-auto"
                style={
                    resizable
                        ? {
                              flex: `0 0 ${split * 100}%`,
                              minWidth: MIN_PANE_WIDTH_PX,
                          }
                        : { flex: 1 }
                }
            >
                {childArray[0]}
            </div>

            {/* Drag handle — only shown when resizable */}
            {resizable && (
                <div
                    className="hidden lg:flex lg:items-center lg:justify-center"
                    style={{ width: 6, cursor: "col-resize", flexShrink: 0 }}
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                    role="separator"
                    aria-orientation="vertical"
                    tabIndex={0}
                >
                    <div className="h-8 w-1 rounded-full bg-slate-300 transition-colors hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-500" />
                </div>
            )}

            {/* Right pane */}
            <div
                className="flex min-w-0 flex-1 lg:h-full lg:overflow-y-auto"
                style={resizable ? { minWidth: MIN_PANE_WIDTH_PX } : undefined}
            >
                {childArray[1]}
            </div>
        </div>
    );
}
