import { Event, EventStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const events: Module<EventStore, RootState> = {
  namespaced: true,
  state: {
    events: []
  },
  mutations: {
    SOCKET_TransactionIssued(state: any, data: any) {
      if (state.events.length > 100) {
        state.events.shift();
      }
      state.events = [
        ...state.events,
        { type: "transaction", relId: data.from, info: data }
      ];
    }
  },
  getters: {
    getEvents: (state: any) => {
      return state.events;
    }
  }
};
