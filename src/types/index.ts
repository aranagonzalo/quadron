// Augment NextAuth session types to include user.id
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export interface Card {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  last_four?: string;
  color: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface IncomeSource {
  id: string;
  user_id: string;
  month: number;
  year: number;
  name: string;
  amount: number;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  card_id?: string;
  date: string;
  description: string;
  amount: number;
  type: 'gasto' | 'abono';
  category_id?: string;
  subcategory_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  month: number;
  year: number;
  card?: Card;
  category?: Category;
  subcategory?: Subcategory;
}
