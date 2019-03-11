<template>
  <div id="app">
    <div id="top">
    <mapVisu></mapVisu>
    <h1 style="text-align: right;">Fancy Liste</h1>
    </div>
    <div id="down">
      <h1>Fancy Liste</h1>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MapVisu from './components/MapVisu.vue';

@Component({
  components: {
    MapVisu,
  },
  sockets: {
    connect() {
      window.console.log('Connected to websocket server.');
    },
},
})
export default class App extends Vue {

private events: string[] = [];

  public start() {
    this.$socket.emit('start');
  }

  private created() {
    ['vehicleAdded',
      'updatedPos']
      .forEach((e) => this.sockets.subscribe(e, (data: any) => {
        // logic goes here
        this.events.push(JSON.stringify({[e]: data}));
    }));
  }

}
</script>

<style>
#top {
    display: grid;
    grid-template-columns: auto 20%;
}
</style>
