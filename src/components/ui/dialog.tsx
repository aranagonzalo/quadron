"use client";

import * as RadixDialog from "@radix-ui/react-dialog";

export function Dialog({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
            {children}
        </RadixDialog.Root>
    );
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
    return <RadixDialog.Trigger asChild>{children}</RadixDialog.Trigger>;
}

export function DialogContent({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <RadixDialog.Content
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                style={{
                    background: "var(--color-panel-bg)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <RadixDialog.Title
                        className="text-base font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        {title}
                    </RadixDialog.Title>
                    <RadixDialog.Close
                        className="rounded-md p-1 transition"
                        style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--color-border-subtle)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </RadixDialog.Close>
                </div>
                {children}
            </RadixDialog.Content>
        </RadixDialog.Portal>
    );
}
