<template>
  <div id="app">
    <div id="top">
       <!--   <div>
    <button @click="changeName">Button</button>
    </div>-->

    <map-visu></map-visu>
    
    <event-list></event-list>
    </div>
    <state-table></state-table>
  </div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';

// components
import MapVisu from './components/MapVisu.vue';
import EventList from './components/EventList.vue';
import StateTable from './components/StateTable.vue';

// internal event bus
import { eventBus } from './events';




export default {
  components: {
    MapVisu,
    EventList,
    StateTable,
  },
  sockets: {
    connect() {
      window.console.log('Connected to websocket server.');
      // get env data from server
        this.$http.get(this.$hostname + '/env').then(function(env) {
               this.$store.commit('mapObjects/initState', env.body)
            });
    },
  },

  created() {
    this.$socket.emit('start');
  },
  methods: {
    changeName(){
      this.$store.commit('mapObjects/changeStopPos', {stopId:'A', newName:'MPLTZ'})
    }
  }
}
</script>

<style>

html {
  overflow:hidden;
}

#app {
  position: relative;
  display: flex;
  flex-flow: column;
  height: 100vh;
}

#top {
    display: grid;
    grid-template-columns: auto 20%;
}
</style>
