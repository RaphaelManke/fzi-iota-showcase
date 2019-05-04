import { User } from './types';
import { Module } from 'vuex';
import { RootState } from '../types';
export const user: Module<User, RootState> = {
  namespaced: true,
  state: {
    seed: 'YOURSEEDHERE',
    destination: '',
    info: { loggedIn: false, balance: 0, name: '-' },
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
    },
    updateCurrentStop(state: any, stop: any) {
      state.info.stop = stop;
    },
    userLogout(state: any) {
      state.seed = '';
      state.destination = '';
      state.info = { loggedIn: false, balance: 0, name: '-' };
    },
    routeFinished(state: any) {
      state.destination = '';
    },
    SOCKET_PosUpdated(state: any, data: any) {
      if (
        state.info.trip !== undefined &&
        state.info.trip.vehicleId === data.id
      ) {
        state.info.position = data.position;
      }
    },
    SOCKET_TripStarted(state: any, data: any) {
      if (data.userId === state.info.id) {
        state.info.trip = data;
        state.info.stop = data.destination;
      }
    },
    SOCKET_TripFinished(state: any, data: any) {
      if (data.userId === state.info.id) {
        state.info.trip = undefined;
        state.info.stop = data.destination;
      }
    },
    SOCKET_PaymentIssued(state: any, payment: any) {
      if (payment.from === state.info.id) {
        state.info.balance -= payment.amount;
      }
    },
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
    },
    isLoggedIn: (state: any) => {
      return state.info.loggedIn;
    },
    getCurrentStopId: (state: any) => {
      return state.info.stop;
    },
  },
};
