<template>
  <div id="state_object">
    <img :src="image_url" />

    <!-- representation for vehicles -->
    <div v-if="type === 'tram' || type === 'car'" class="info_container">
      {{ vehicleData.name }} 
      <span v-if="vehicleData.trip"> Current passenger: {{getUserById(vehicleData.trip.userId).name}}</span>
    </div>

    <!-- representation for stops -->
    <div v-if="type === 'stop'" class="info_container">
      {{ stopData.name }}
    </div>

    <!-- representation for users -->
    <div v-if="type === 'male'" class="info_container">
      {{ userData.name }} 
      <span v-if="userData.trip"> currently in {{getVehicleById(userData.trip.vehicleId).name}}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
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
    },
    userData() {
      return this.$store.getters["mapObjects/getUserById"](this.id);
    }
  },
  methods: {
    getVehicleById(id) {
      return this.$store.getters["mapObjects/getVehicleById"](id);
    },
    getUserById(id) {
      return this.$store.getters["mapObjects/getUserById"](id);
    }
  }
};
</script>

<style scoped>
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
  border-radius: 5px;
  height: 4vh;
}
</style>
