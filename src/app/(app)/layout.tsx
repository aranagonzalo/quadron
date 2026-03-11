import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import Sidebar from "@/src/components/layout/Sidebar";
import TopBar from "@/src/components/layout/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    const user = session?.user ?? null;

    return (
        <div className="flex h-screen" style={{ background: "var(--color-canvas-bg)" }}>
            <Sidebar user={user} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <main
                    className="flex-1 overflow-auto"
                    style={{ background: "var(--color-canvas-bg)" }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
