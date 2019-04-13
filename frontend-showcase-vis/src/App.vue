<template>
  <div id="app">
    <b-row no-gutters="true">
      <b-col cols="9">
      <map-visu/>
      </b-col>
      <b-col>
      <event-list />
      </b-col>
    </b-row>

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
  height: 100vh;
}
</style>
