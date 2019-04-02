<template>
  <div class="container-fluid">

    
    <b-jumbotron>
        <template slot="header">Welcome</template>
    </b-jumbotron>


        <b-form-group
      id="fieldset-1"
      :description="seed"
      label-for="input-1"
      :invalid-feedback="invalidFeedback"
      :valid-feedback="validFeedback"
      :state="state"
    >
      <b-form-input id="input-1" v-model="seed" :state="state" trim></b-form-input>
    </b-form-group>

        <b-button>

            Scan QR-Code

        </b-button>

        <b-button @click="login">

            Login

        </b-button>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      currentSeed: "ABCDEFGHIJKLMNOP"
    };
  },
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

