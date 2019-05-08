import { Event, EventStore } from './types';
import { Module } from 'vuex';
import { RootState } from '../types';
import moment from 'moment';

function getNewEvent(type: string, relId: string, data: any) {
  return {
    type,
    relId,
    info: data,
    time: moment(new Date()).format('HH:mm:ss'),
  };
}
export const events: Module<EventStore, RootState> = {
  namespaced: true,
  state: {
    events: [],
    max_length: 100,
  },
  mutations: {
    routeFinished(state: any) {
      state.events = [];
    },
    SOCKET_PaymentIssued(state: any, data: any) {
      if (state.events.length > state.max_length) {
        state.events.shift();
      }
      state.events.push(getNewEvent('payment', data.from, data));
    },
    SOCKET_TripStarted(state: any, data: any) {
      if (state.events.length > state.max_length) {
        state.events.shift();
      }
      state.events.push(getNewEvent('tripStarted', data.userId, data));
    },
    SOCKET_TripFinished(state: any, data: any) {
      if (state.events.length > state.max_length) {
        state.events.shift();
      }
      state.events.push(getNewEvent('tripFinished', data.userId, data));
    },
  },
  getters: {
    getEvents: (state: any) => {
      return state.events;
    },
  },
};
