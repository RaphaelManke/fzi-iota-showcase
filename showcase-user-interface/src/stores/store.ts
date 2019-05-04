import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { mapObjects } from '@/stores/mapObjects/index';
import { transactions } from '@/stores/transactions/index';
import { routes } from '@/stores/routes/index';
import { events } from '@/stores/events/index';
import { user } from '@/stores/user/index';
import { RootState } from './types';
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

const store: StoreOptions<RootState> = {
  state: {},
  mutations: {},
  actions: {},
  modules: {
    mapObjects,
    transactions,
    user,
    routes,
    events,
  },
  plugins: [createPersistedState({})],
};
export default new Vuex.Store<RootState>(store);
