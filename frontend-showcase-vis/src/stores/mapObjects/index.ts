import { Env, MapObjectsState } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const mapObjects: Module<MapObjectsState, RootState> = {
  namespaced: true,
  state: {
    env: {
      connections: [],
      users: [],
      stops: [],
      vehicles: []
    }
  },
  mutations: {
    initState(state: any, event: any) {
      state.env = event;
    },
    SOCKET_PosUpdated(state: any, data: any) {
      const vehicle = state.env.vehicles.find((el: any) => el.id === data.id);
      vehicle.position = data.position;
    }
  },
  getters: {
    getStops: (state: any) => {
      return state.env.stops;
    },
    getStopById: (state: any) => (id: string) => {
      return state.env.stops.find((el: any) => el.id === id);
    },
    getConnections: (state: any) => {
      return state.env.connections;
    },
    getVehicles: (state: any) => {
      return state.env.vehicles;
    },
    getVehicleById: (state: any) => (id: string) => {
      return state.env.vehicles.find((el: any) => el.id === id);
    },
    getUserByName: (state: any) => (name: string) => {
      return state.env.users.find((el: any) => el.paras.name === name);
    }
  }
};
