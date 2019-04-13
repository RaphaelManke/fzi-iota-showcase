<template>
  <b-card>
    
      
    <b-card-img :src="image_url" />

    <!-- representation for vehicles -->
    <b-list-group v-if="type === 'tram' || type === 'car' || type === 'bike'">
      <b-list-group-item>Name: {{ vehicleData.name }}</b-list-group-item>
      <b-list-group-item v-if="vehicleData.trip"> Passenger: {{getUserById(vehicleData.trip.userId).name}}</b-list-group-item>
      <b-list-group-item v-if="vehicleData.checkIn.stop"> Stop: {{getStopById(vehicleData.checkIn.stop).name}}</b-list-group-item>
    </b-list-group>

    <!-- representation for stops 
    <b-col v-if="type === 'stop'">
      {{ stopData.name }}
    </b-col>-->

    <!-- representation for users -->
    <b-list-group v-if="type === 'male'">
      <b-list-group-item>Name: {{ userData.name }}</b-list-group-item>
      <b-list-group-item v-if="userData.trip"> Vehicle: {{getVehicleById(userData.trip.vehicleId).name}}</b-list-group-item>
    </b-list-group>
  </b-card>
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
    },
    getStopById(id) {
      return this.$store.getters["mapObjects/getStopById"](id);
    }
  }
};
</script>

<style scoped>
.card-img {
  height: 20px;
  width: auto;
}
.card-body {
  padding: 0 0.25em;
}

.list-group-item {
  padding: 0;
  border: none;
}
</style>
