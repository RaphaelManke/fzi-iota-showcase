<template>
  <div id="state_object">
    <img :src="image_url">
    <div
      class="info_container"
      v-if="type === 'tram' || type === 'car'"
    >{{vehicleData.name}}: Speed ({{vehicleData.info.speed}})</div>
    <div class="info_container" v-if="type === 'stop'">{{stopData.name}}</div>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: Object,
      default: () => ""
    },
    type: {
      type: String,
      default: () => ""
    }
  },
  data() {
    return {
      image_url: "assets/images/" + this.type + ".png"
    };
  },
  computed: {
    vehicleData() {
      return this.$store.getters["mapObjects/getVehicleById"](this.id);
    },
    stopData() {
      return this.$store.getters["mapObjects/getStopById"](this.id);
    }
  }
};
</script>

<style scoped>
p {
  margin: 0;
  padding: 0;
}

img {
  max-height: 100%;
}

.info_container {
  margin: auto;
}

#state_object {
  display: flex;
  flex-wrap: wrap;
  margin: auto;
  border: groove 2px;
  height: 4vh;
}
</style>
