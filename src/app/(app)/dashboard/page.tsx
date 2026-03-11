import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { getTransactions, getCategories } from "@/src/lib/actions/transactions";
import { getIncomeSources } from "@/src/lib/actions/income";
import DashboardClient from "@/src/components/dashboard/DashboardClient";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ m?: string }>;
}) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string;

    const { m } = await searchParams;
    const now = new Date();
    const [year, month] = m
        ? m.split("-").map(Number)
        : [now.getFullYear(), now.getMonth() + 1];

    const [transactions, categories, incomeSources] = await Promise.all([
        getTransactions(userId, month, year),
        getCategories(),
        getIncomeSources(userId, month, year),
    ]);

    return (
        <DashboardClient
            key={`${year}-${month}`}
            userId={userId}
            month={month}
            year={year}
            initialTransactions={transactions}
            categories={categories}
            initialIncomeSources={incomeSources}
        />
    );
}
