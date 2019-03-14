<template>
  <div id="app">
    <div id="top">
    <mapVisu></mapVisu>
    <h2 style="position: absolute; right: 0; width: 20%; text-align: center; top: 0;">Events</h2>
    <eventList></eventList>
    </div>
    <h1>Fancy Info Box</h1>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

// components
import MapVisu from './components/MapVisu.vue';
import EventList from './components/EventList.vue';

// internal event bus
import { eventBus } from './events';



@Component({
  components: {
    MapVisu,
    EventList,
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
    ['vehicleAdded', 'markerDetected',
      'updatedPos']
      .forEach((e) => this.sockets.subscribe(e, (data: any) => {
        eventBus.emit(e, data);
    }));
    this.$socket.emit('start');
  }

}
</script>

<style>
#top {
    display: grid;
    grid-template-columns: auto 20%;
}
</style>
