<template>
  <div id="login_screen">

    
    <b-jumbotron>
        <template slot="header">Welcome</template>
    </b-jumbotron>

    <div class="button_container">

        Current Seed: {{currentSeed}}

        <button>

            <h1>Scan QR-Code</h1>

        </button>

        <button @click="login">

            <h1>Login</h1>

        </button>
    </div>
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
  }
};
</script>

<style>

</style>

