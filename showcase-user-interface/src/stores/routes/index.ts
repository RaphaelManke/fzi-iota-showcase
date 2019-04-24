import { RouteStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const routes: Module<RouteStore, RootState> = {
  namespaced: true,
  state: {
    routesAvailable: [],
    routeSelectedIndex: -1,
    routeSelected: undefined,
    trip: undefined,
    nextTrip: undefined
  },
  mutations: {
    updateRoutesAvailable(state: any, route: any) {
      state.routesAvailable = route;
    },
    updateRouteSelected(state: any, selected: string) {
      state.routeSelectedIndex = selected;
      state.routeSelected = JSON.parse(
        JSON.stringify(state.routesAvailable[state.routeSelectedIndex])
      );
      state.routeSelected.sections.forEach((el: any) => {
        el.duration = Math.round(
          (Date.parse(el.arrival) - Date.parse(el.departure)) / 500 - 1
        );
        el.passed_count = 0;
      });
    },
    routeFinished(state: any) {
      state.routeSelected = undefined;
      state.routeSelectedIndex = -1;
      state.routesAvailable = [];
    },
    SOCKET_PosUpdated(state: any, data: any) {
      if (state.trip) {
        state.routeSelected.sections.find(
          (sec: any) =>
            sec.vehicle.id === state.trip.vehicleId &&
            data.id === state.trip.vehicleId
        ).passed_count++;
        state.routeSelected = JSON.parse(JSON.stringify(state.routeSelected));
      }
    },
    SOCKET_ReachedStop(state: any, data: any) {
      if (
        data.stopId === state.nextTrip.start &&
        data.vehicleId === state.nextTrip.vehicle
      ) {
        // make the post request here?
        state.nextTrip = undefined;
      }
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
    }
  },
  actions: {
    SOCKET_TripStarted({ state, commit, rootGetters }, trip: any) {
      if (trip.userId === rootGetters["user/getUserInfo"].id) {
        commit("TripStarted", trip);
      }
    },
    SOCKET_TripFinished({ state, commit, rootGetters }, trip: any) {
      if (trip.userId === rootGetters["user/getUserInfo"].id) {
        commit("TripFinished");
      }
    }
  },
  getters: {
    getRoutesAvailable: (state: any) => {
      return state.routesAvailable;
    },
    getRouteSelectedIndex: (state: any) => {
      return state.routeSelectedIndex;
    },
    getRouteById: (state: any) => (id: string) => {
      return state.routesAvailable.find((el: any) => el.id === id);
    },
    getRouteSelected(state: any) {
      return state.routeSelected;
    },
    getNextTrip(state: any) {
      return state.nextTrip;
    }
  }
};
