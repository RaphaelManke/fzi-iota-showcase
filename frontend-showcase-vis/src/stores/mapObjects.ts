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
        initState (state: any, event:any ) {
            state.env = event;
        }
     },
    actions: {  },
    getters: { 
        getStops(state: any){
            return state.env.stops;
        },
        getConnections(state: any){
            return state.env.connections;
        },
     },
  };
