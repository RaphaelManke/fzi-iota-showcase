export const mapObjects = {
    namespaced : true,
    state: { 
        env: undefined,
    },
    mutations: { 
        initState (state: any, event:any ) {
            state.env = event;
        }
     },
    actions: {  },
    getters: {  },
  };
