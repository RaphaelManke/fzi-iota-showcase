export const mapObjects = {
    namespaced : true,
    state: {
        env: {
            connections: [],
            users: [],
            stops: [],
            vehicles: [],
        },
    },
    mutations: {
        initState(state: any, event: any ) {
            state.env = event;
        },
        changeStopName(state: any, payload: any) {
            
            const stop = state.env.stops.find((el: any) => el.id === payload.stopId);
            stop.name = payload.newName;
            
        },
        changeStopPos(state: any, payload: any) {
            
            const stop = state.env.stops.find((el: any) => el.id === payload.stopId);
            stop.position.lat += 0.0001;
            
        },

     },
     actions: {
        SOCKET_PosUpdated(state: any, data: any) {
            window.console.log(data);
        }
      },
    getters: {
        getStops: (state: any) => {
            return state.env.stops;
        },
        getStopById: (state: any) => (id:string) => {
            // return 'ABC';
            return state.env.stops.find((el: any) => el.id === id);
         },
        getConnections: (state: any) => {
            return state.env.connections;
        },
        getVehicles: (state: any) => {
            return state.env.vehicles;
        },
        getUserByName: (state: any) => (name: string) => {
            return state.env.users.find((el: any) => el.paras.name === name);
        },
     },
  };
