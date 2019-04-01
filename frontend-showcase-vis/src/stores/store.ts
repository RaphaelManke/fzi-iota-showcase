import Vue from "vue";
import Vuex, { StoreOptions } from "vuex";
import { mapObjects } from "@/stores/mapObjects/index";
import { RootState } from "./types";

Vue.use(Vuex);

const store: StoreOptions<RootState> = {
  state: {},
  mutations: {},
  actions: {},
  modules: {
    mapObjects
  }
};
export default new Vuex.Store<RootState>(store);
