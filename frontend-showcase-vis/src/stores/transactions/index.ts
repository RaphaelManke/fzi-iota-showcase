import { Transaction, TransactionStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
import moment from "moment";

function timestampTransaction(transaction: any) {
  transaction.time = moment(new Date()).format("hh:mm:ss");
  return transaction;
}
export const transactions: Module<TransactionStore, RootState> = {
  namespaced: true,
  state: {
    transactions: []
  },
  mutations: {
    SOCKET_CheckIn(state: any, data: any) {
      if (state.transactions.length > 50) {
        state.transactions.shift();
      }
      // state.transactions.push(
      //   timestampTransaction({ from: data.vehicleId, to: "Tangle", amount: 0 })
      // );
    },
    SOCKET_TransactionIssued(state: any, data: any) {
      if (state.transactions.length > 50) {
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
