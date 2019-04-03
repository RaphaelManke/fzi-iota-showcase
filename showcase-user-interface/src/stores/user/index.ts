import { User } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const user: Module<User, RootState> = {
  namespaced: true,
  state: {
    seed: "PREDEFINEDTESTSEED",
    destination: "Destination..."
  },
  mutations: {
    updateSeed(state: any, seed: string) {
      state.seed = seed;
    },
    updateDestination(state: any, destination: string) {
      state.destination = destination;
    }
  },
  getters: {
    getSeed: (state: any) => {
      return state.seed;
    },
    getDestination: (state: any) => {
      return state.destination;
    }
  }
};
