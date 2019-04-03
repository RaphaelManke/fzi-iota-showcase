<template>
  <b-container fluid>
    <b-jumbotron class="text-center">
      <template slot="header"
        >Welcome</template
      >
    </b-jumbotron>

    <b-row align-h="center">
      <b-col cols="8">
        <b-form-group description="Your seed" :state="state">
          <b-form-input v-model="seed" :state="state"></b-form-input>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row align-h="center">
      <b-form-group>
        <b-button>
          Scan QR-Code
        </b-button>
      </b-form-group>
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
            alert("You are already logged in!");
          }
        });
    }
  }
};
</script>


<style></style>
