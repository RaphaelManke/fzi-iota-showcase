import { Transaction, TransactionStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
import moment from "moment";

function timestampTransaction(transaction: any) {
  transaction.time = moment(new Date()).format("HH:mm:ss");
  return transaction;
}
export const transactions: Module<TransactionStore, RootState> = {
  namespaced: true,
  state: {
    transactions: [],
    max_transactions_shown: 4
  },
  mutations: {
    SOCKET_TransactionIssued(state: any, data: any) {
      if (state.transactions.length > state.max_transactions_shown - 1) {
        state.transactions.shift();
      }
      state.transactions.push(timestampTransaction(data));
    }
  },
  getters: {
    getTransactions: (state: any) => {
      return state.transactions;
    }
  }
};
