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
     },
    actions: {  },
    getters: {
        getStops: (state: any) => {
            return state.env.stops;
        },
        getStopsById: (state: any) => (id: string) => {
            // return 'ABC';
            return state.env.stops.find((el: any) => el.id === id);
         },
        getConnections: (state: any) => {
            return state.env.connections;
        },
        getVehicles: (state: any) => {
            return state.env.vehicles;
        },
     },
  };
