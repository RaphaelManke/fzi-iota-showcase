<template>
  <div id="login_screen">
    
    <div class="banner">
        <h1>Welcome</h1>
    </div>

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
button {
  margin: auto;
}

.banner {
  background-color: green;
  height: 30vh;
  line-height: 30vh;
  text-align: center;
}

.button_container {
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

#login_screen {
}
</style>

