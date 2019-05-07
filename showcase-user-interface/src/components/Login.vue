<template>
  <b-container fluid>
    <b-modal ref="login_modal" hide-footer>
    <div class="d-block text-center">
      <h3>User already logged in!</h3>
    </div>
  </b-modal>
    <b-jumbotron class="text-center">
      <template slot="header"
        >Welcome</template
      >
    </b-jumbotron>

    <b-row align-h="center">
      <b-col cols="8">
        <b-form-group description="Your seed" :state="state" id="seed_form">
          <b-form-input v-model="seed" :state="state"></b-form-input>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row align-h="center">
      <b-form-group>
        <b-button @click="scanning=!scanning">
          Scan QR-Code
        </b-button>
      </b-form-group>
      <b-popover triggers="" :show.sync="scanning" target="seed_form" placement="top" title="Scan QR-Code">
        <qrcode-stream @decode="onDecode"></qrcode-stream>
      </b-popover>
    </b-row>
    <b-row align-h="center">
      <b-form-group>
        <b-button variant="primary" @click="login">
          Login
        </b-button>
      </b-form-group>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      scanning: false
    };
  },
  mounted() {
    if (this.$store.getters["user/isLoggedIn"]) {
      this.login();
    }
  },
  computed: {
    // check if seed is valid
    state() {
      return this.seed.length === 81 ? true : false;
    },
    seed: {
      get() {
        return this.$store.getters["user/getSeed"];
      },
      set(value) {
        this.$store.commit("user/updateSeed", value);
      }
    }
  },
  methods: {
    onDecode(decodedString) {
      this.seed = decodedString;
      if (this.state) {
        this.scanning = false;
        this.login();
      }
    },
    login() {
      this.$http
        .post(this.$hostname + "/login", this.seed)
        .then(function(response) {
          if (response.status === 200) {
            this.$store.commit("user/updateUserInfo", response.body);
            this.$router.push("route-selection");
          }
        })
        .catch(function(response) {
          if (response.status === 406) {
            this.$refs["login_modal"].show();
          } else {
            window.console.error(response);
            this.$store.commit("user/userLogout");
            this.$store.commit("routes/routeFinished");
            this.$store.commit("events/routeFinished");
          }
        });
    }
  }
};
</script>


<style></style>
