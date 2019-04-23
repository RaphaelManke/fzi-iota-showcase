import { Transaction, TransactionStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const transactions: Module<TransactionStore, RootState> = {
  namespaced: true,
  state: {
    transactions: []
  },
  mutations: {
    SOCKET_PaymentIssued(state: any, data: any) {
      if (state.transactions.length > 50) {
        state.transactions.shift();
      }
      state.transactions = [...state.transactions, data];
    }
  },
  getters: {
    getPayments: (state: any) => {
      return state.transactions;
    }
  }
};
