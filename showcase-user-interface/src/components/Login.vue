<template>
  <b-container fluid>

    <b-jumbotron class="text-center">
        <template slot="header">Welcome</template>
    </b-jumbotron>
    
    <b-row align-h="center">
        <b-col cols="8">
        <b-form-group
        description="Your seed"
        :state="state"
        >
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
        <b-button @click="login" variant="primary">

            Login

        </b-button>
        </b-form-group>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: "Login",
  methods: {
    login() {
      this.$router.push("route-selection");
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
  }
};
</script>

<style>
</style>

