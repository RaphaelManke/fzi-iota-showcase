<template>
  <div id="app">
    <b-row no-gutters="true" style="height: 75vh">
      <b-col cols="9">
      <map-visu/>
      </b-col>
      <b-col>
      <route-list />
      </b-col>
    </b-row>
    
      <tangle-panel style="height: 25vh"/>
    
    
  </div>
</template>

<script>
import { Component, Vue } from "vue-property-decorator";

// components
import MapVisu from "./components/MapVisu.vue";
import RouteList from "./components/RouteList.vue";
import TanglePanel from "./components/TanglePanel.vue";

export default {
  components: {
    MapVisu,
    RouteList,
    TanglePanel
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
  font-size: 1.5rem;
  overflow: hidden;
}
</style>
