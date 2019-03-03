<template>
  <div class="hello">
    <button v-on:click="start()">Start</button>
    <ul id="example-1">
      <li v-for="event in events" :key="event">
        {{ event }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Prop, Vue } from 'vue-property-decorator';

@Component({
  sockets: {
    connect() {
      window.console.log('Connected to websocket server.');
    },
}})
export default class HelloWorld extends Vue {
  private events: string[] = [];

  public start() {
    this.$socket.emit('start');
  }

  private created() {
    ['started', 'stopped', 'vehicleAdded', 'markerAdded',
      'updatedPos', 'markerDetected', 'rfidDetected', 'rfidRemoved']
      .forEach((e) => this.sockets.subscribe(e, (data: any) => {
        // logic goes here
        this.events.push(JSON.stringify({[e]: data}));
    }));
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
li {
  text-align: left;
}
h3 {
  margin: 40px 0 0;
}
/* ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
} */
a {
  color: #42b983;
}
</style>
