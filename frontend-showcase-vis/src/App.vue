<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';

@Component({
  components: {
    HelloWorld,
  },
  sockets: {
    connect() {
      window.console.log('Connected to websocket server.');
    },
}
})
export default class App extends Vue {

private events: string[] = [];

  public start() {
    this.$socket.emit('start');
  }

  private created() {
    ['vehicleAdded',
      'updatedPos',]
      .forEach((e) => this.sockets.subscribe(e, (data: any) => {
        // logic goes here
        this.events.push(JSON.stringify({[e]: data}));
    }));
  }

}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
