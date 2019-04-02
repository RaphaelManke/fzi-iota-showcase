import { User } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const user: Module<User, RootState> = {
  namespaced: true,
  state: {
    seed: ""
  },
  mutations: {},
  getters: {
    getSeed: (state: any) => {
      return state.seed;
    }
  }
};
