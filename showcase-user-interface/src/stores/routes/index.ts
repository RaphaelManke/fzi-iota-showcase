import { RouteStore } from './types';
import { Module } from 'vuex';
import { RootState } from '../types';
import Vue from 'vue';
export const routes: Module<RouteStore, RootState> = {
  namespaced: true,
  state: {
    routesAvailable: [],
    routeSelected: undefined,
    trip: undefined,
    nextTrip: undefined,
    routeState: '',
  },
  mutations: {
    updateRoutesAvailable(state: any, route: any) {
      state.routesAvailable = route;
      state.routesAvailable.forEach((element: any) => {
        element.sections.forEach((el: any) => {
          el.duration = Math.round(
            (Date.parse(el.arrival) - Date.parse(el.departure)) / 1000,
          );
        });
      });
    },
    updateRouteSelected(state: any, selected: any) {
      state.routeSelected = selected;
      state.routeSelected.sections.forEach((el: any) => {
        el.duration = Math.round(
          (Date.parse(el.arrival) - Date.parse(el.departure)) / 500 - 1,
        );
        el.passed_count = 0;
      });
    },
    routeFinished(state: any) {
      state.routeSelected = undefined;
      state.routesAvailable = [];
    },
    SOCKET_PosUpdated(state: any, data: any) {
      if (state.trip && state.routeSelected) {
        state.routeSelected.sections.find(
          (sec: any) =>
            sec.vehicle.id === state.trip.vehicleId &&
            data.id === state.trip.vehicleId,
        ).passed_count++;
        state.routeSelected = JSON.parse(JSON.stringify(state.routeSelected));
      }
    },
    SOCKET_ReachedStop(state: any, data: any) {
      if (
        state.nextTrip &&
        data.stopId === state.nextTrip.start &&
        data.vehicleId === state.nextTrip.vehicle &&
        data.allowedDestinations.includes(state.nextTrip.destination)
      ) {
        // make the post request
        // @ts-ignore
        Vue.http
          .post(Vue.prototype.$hostname + '/trip', state.nextTrip)
          .then(function(response: any) {
            state.routeState = ' Boarding ';
          })
          .catch(function(response: any) {
            window.console.log(response);
          });
      }
    },
    changeRouteState(state: any, newState: string) {
      state.routeState = newState;
    },
    TripStarted(state: any, trip: any) {
      state.trip = trip;
      state.nextTrip = undefined;
    },
    TripFinished(state: any) {
      state.trip = undefined;
    },
    setNextTrip(state: any, nextTrip: any) {
      state.nextTrip = nextTrip;
      state.routeState = ' Await arrival ';
    },
  },
  actions: {
    SOCKET_TripStarted({ state, commit, rootGetters }, trip: any) {
      if (trip.userId === rootGetters['user/getUserInfo'].id) {
        commit('TripStarted', trip);
      }
    },
    SOCKET_TripFinished({ state, commit, rootGetters }, trip: any) {
      if (trip.userId === rootGetters['user/getUserInfo'].id) {
        commit('TripFinished');
      }
    },
    SOCKET_BoardingStarted({ state, commit, rootGetters }, info: any) {
      if (info.userId === rootGetters['user/getUserInfo'].id) {
        commit('changeRouteState', ' Boarding started ');
      }
    },
  },
  getters: {
    getRoutesAvailable: (state: any) => {
      return state.routesAvailable;
    },
    getRouteById: (state: any) => (id: string) => {
      return state.routesAvailable.find((el: any) => el.id === id);
    },
    getRouteSelected(state: any) {
      return state.routeSelected;
    },
    getNextTrip(state: any) {
      return state.nextTrip;
    },
    getRouteState(state: any) {
      return state.routeState;
    },
  },
};
