<template>
  <b-container fluid>
    <b-navbar :variant="navbarVariant" type="light">
    <b-navbar-brand href="#">
      <img src="assets/images/iota.png" class="d-inline-block align-top">
      FZI IOTA SHOWCASE
    </b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-nav-text v-if="isLoggedIn" class="mr-sm-2"><b>User:</b> {{userInfo.name}} <b>Balance:</b> {{userInfo.balance}}</b-nav-text>
      <b-button v-if="isLoggedIn" variant="secondary" @click="logout">Logout</b-button>
    </b-navbar-nav>
  </b-navbar>
    <router-view />
  </b-container>
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
    },
    seed() {
      return this.$store.getters["user/getSeed"];
    },
    isLoggedIn() {
      return this.$store.getters["user/isLoggedIn"];
    }
  },
  methods: {
    logout() {
      this.$http
        .post(this.$hostname + "/logout", this.seed)
        .then(function(response) {
          this.$store.commit("user/userLogout");
          this.$router.push("/");
        })
        .catch(function(response) {
          this.$store.commit("user/userLogout");
          this.$router.push("/");
        });
    }
  }
};
</script>

<style>
html {
  overflow: hidden;
  min-height: 100vh;
  height: 100%;
}
.navbar-brand img {
  height: 30px;
}

.no-space-break {
  white-space: nowrap;
}
</style>
