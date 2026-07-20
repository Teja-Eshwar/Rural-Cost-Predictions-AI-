import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Transaction = {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
};

export type Profile = {
  id: string;
  business_name: string;
  owner_name: string;
  business_type: string;
  location: string;
  phone: string;
  language: string;
  dark_mode: boolean;
  notify_enabled: boolean;
  created_at: string;
};

export const INCOME_CATEGORIES = ['Sales', 'Services', 'Other Income'];
export const EXPENSE_CATEGORIES = ['Inventory', 'Loan', 'EMI', 'Transport', 'Salary', 'Utilities', 'Grocery', 'Business', 'Miscellaneous'];

export const CATEGORY_ICONS: Record<string, string> = {
  Sales: '🛒',
  Services: '🛠️',
  'Other Income': '➕',
  Inventory: '📦',
  Loan: '🏦',
  EMI: '💳',
  Transport: '🚚',
  Salary: '👷',
  Utilities: '💡',
  Grocery: '🛍️',
  Business: '🏪',
  Miscellaneous: '📝',
};
