<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import Login from "./components/Login";

export default {
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
  height: 100vh;
}
</style>
