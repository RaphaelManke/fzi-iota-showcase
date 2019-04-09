import { Event, EventStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const events: Module<EventStore, RootState> = {
  namespaced: true,
  state: {
    events: [],
    max_length: 100
  },
  mutations: {
    SOCKET_TransactionIssued(state: any, data: any) {
      if (state.events.length > state.max_length) {
        state.events.shift();
      }
      state.events.push({ type: "transaction", relId: data.from, info: data });
    },
    SOCKET_TripStarted(state: any, data: any) {
      if (state.events.length > state.max_length) {
        state.events.shift();
      }
      state.events.push({
        type: "tripStarted",
        relId: data.userId,
        info: data
      });
    },
    SOCKET_TripFinished(state: any, data: any) {
      if (state.events.length > state.max_length) {
        state.events.shift();
      }
      state.events.push({
        type: "tripFinished",
        relId: data.userId,
        info: data
      });
    }
  },
  getters: {
    getEvents: (state: any) => {
      return state.events;
    }
  }
};
