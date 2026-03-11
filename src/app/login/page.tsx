import AuthCard from "@/src/components/auth/auth-card";

export default function LoginPage() {
    return (
        <main
            className="flex min-h-screen items-center justify-center px-4 py-12"
            style={{ background: "var(--color-canvas-bg)" }}
        >
            <AuthCard />
        </main>
    );
}
