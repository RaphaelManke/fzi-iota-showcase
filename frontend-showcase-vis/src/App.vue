<template>
  <div id="app">
    <div id="top">
      <map-visu />

      <event-list />
    </div>

    <state-table />
  </div>
</template>

<script>
import { Component, Vue } from "vue-property-decorator";

// components
import MapVisu from "./components/MapVisu.vue";
import EventList from "./components/EventList.vue";
import StateTable from "./components/StateTable.vue";

export default {
  components: {
    MapVisu,
    EventList,
    StateTable
  },
  sockets: {
    connect() {
      window.console.log("Connected to websocket server.");
      // get env data from server
      this.$http.get(this.$hostname + "/env").then(function(env) {
        this.$store.commit("mapObjects/initState", env.body);
      });
    }
  }
};
</script>

<style>
html {
  overflow: hidden;
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
