export interface TransactionStore {
  transactions: Transaction[];
  max_transactions_shown: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  time: string;
}
