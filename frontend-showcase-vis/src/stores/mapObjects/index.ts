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
      if (vehicle.trips.length > 0) {
        vehicle.trips.forEach((trip: any) => {
          const user = state.env.users.find((el: any) => el.id === trip.userId);
          user.position = data.position;
        });
      }
    },
    SOCKET_Login(state: any, user: any) {
      state.env.users.push(user);
    },
    SOCKET_Logout(state: any, user: any) {
      state.env.users = state.env.users.filter((el: any) => el.id !== user.id);
    },
    // things got a bit messy because vuex does not update pops properly
    SOCKET_TripStarted(state: any, data: any) {
      const newUsers = [...state.env.users];
      newUsers.find((el: any) => el.id === data.userId).trip = data;
      state.env.users = newUsers;
      const newVehicles = [...state.env.vehicles];
      newVehicles.find((el: any) => el.id === data.vehicleId).trips.push(data);
      state.env.vehicles = newVehicles;
    },
    SOCKET_TripFinished(state: any, data: any) {
      const newUsers = [...state.env.users];
      newUsers.find((el: any) => el.id === data.userId).trip = undefined;
      state.env.users = newUsers;
      const newVehicles = [...state.env.vehicles];
      const vehicle = newVehicles.find((el: any) => el.id === data.vehicleId);
      vehicle.trips = vehicle.trips.filter(
        (el: any) => el.userId !== data.userId
      );
      state.env.vehicles = newVehicles;
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
    getUsers: (state: any) => {
      return state.env.users;
    },
    getUserById: (state: any) => (id: string) => {
      return state.env.users.find((el: any) => el.id === id);
    }
  }
};
