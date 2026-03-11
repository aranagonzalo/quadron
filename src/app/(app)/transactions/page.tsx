import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { getTransactions, getCategories } from "@/src/lib/actions/transactions";
import { getCards } from "@/src/lib/actions/cards";
import TransactionsClient from "@/src/components/transactions/TransactionsClient";

export default async function TransactionsPage({
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

  const [transactions, categories, cards] = await Promise.all([
    getTransactions(userId, month, year),
    getCategories(),
    getCards(userId),
  ]);

  return (
    <TransactionsClient
      key={`${year}-${month}`}
      initialTransactions={transactions}
      categories={categories}
      cards={cards}
      userId={userId}
      month={month}
      year={year}
    />
  );
}
