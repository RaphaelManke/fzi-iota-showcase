<template>
  <div id="app">
    <div id="top">
    <map-visu></map-visu>
    
    <event-list></event-list>
    </div>
    <state-table></state-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

// components
import MapVisu from './components/MapVisu.vue';
import EventList from './components/EventList.vue';
import StateTable from './components/StateTable.vue';

// internal event bus
import { eventBus } from './events';



@Component({
  components: {
    MapVisu,
    EventList,
    StateTable,
  },
  sockets: {
    connect() {
      window.console.log('Connected to websocket server.');
    },
},
})
export default class App extends Vue {

  private created() {
    // passing on each socket event to the internal event bus
    ['vehicleAdded', 'markerDetected', 'rfidDetected',
      'updatedPos']
      .forEach((e) => this.sockets.subscribe(e, (data: any) => {
        eventBus.emit(e, data);
    }));
    this.$socket.emit('start');
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
