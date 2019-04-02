import { User } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const user: Module<User, RootState> = {
  namespaced: true,
  state: {
    seed: ""
  },
  mutations: {
    updateSeed(state: any, seed: string) {
      state.seed = seed;
    }
  },
  getters: {
    getSeed: (state: any) => {
      return state.seed;
    }
  }
};
