<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import Login from "./components/Login";

export default {
  components: {
    Login
  }
};
</script>

<style>
html {
  overflow: hidden;
}
</style>
