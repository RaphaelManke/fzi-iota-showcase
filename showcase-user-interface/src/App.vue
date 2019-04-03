<template>
  <div id="app">
    <b-navbar :variant="navbarVariant" type="light">
    <b-navbar-brand href="#">
      <img src="assets/images/iota.png" class="d-inline-block align-top">
      FZI IOTA SHOWCASE
    </b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-nav-text class="mr-sm-2">User: {{userInfo.name}} Balance: {{userInfo.balance}}</b-nav-text>
      <b-button variant="secondary">Logout</b-button>
    </b-navbar-nav>
  </b-navbar>
    <router-view />
  </div>
</template>

<script>
export default {
  sockets: {
    connect() {
      window.console.log("Connected to websocket server.");
      // get env data from server
      this.$http.get(this.$hostname + "/env").then(function(env) {
        this.$store.commit("mapObjects/initState", env.body);
      });
    }
  },
  computed: {
    navbarVariant() {
      return this.$store.getters["user/isLoggedIn"] ? "success" : "danger";
    },
    userInfo() {
      return this.$store.getters["user/getUserInfo"];
    }
  }
};
</script>

<style>
html {
  overflow: hidden;
  height: 100vh;
}
.navbar-brand img {
  height: 30px;
}
</style>
