export interface TransactionStore {
  transactions: Transaction[];
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}
