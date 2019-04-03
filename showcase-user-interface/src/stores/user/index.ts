import { User } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const user: Module<User, RootState> = {
  namespaced: true,
  state: {
    seed:
      "EWRTZJHGSDGTRHNGVDISUGHIFVDJFERHUFBGRZEUFSDHFEGBRVHISDJIFUBUHVFDSHFUERIBUJHDRGBCG",
    destination: "Destination...",
    info: {}
  },
  mutations: {
    updateSeed(state: any, seed: string) {
      state.seed = seed;
    },
    updateDestination(state: any, destination: string) {
      state.destination = destination;
    },
    updateUserInfo(state: any, info: any) {
      state.info = info;
    }
  },
  getters: {
    getSeed: (state: any) => {
      return state.seed;
    },
    getDestination: (state: any) => {
      return state.destination;
    },
    getUserInfo: (state: any) => {
      return state.info;
    }
  }
};
