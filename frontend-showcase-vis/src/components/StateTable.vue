<template>
  <div id="table_container">
    <div class="table_wrapper">
      <state-table-object
        v-for="vehicle in vehicles"
        :id="vehicle.id"
        :key="vehicle.id"
        :type="vehicle.info.type"
      />
    </div>

    <div class="table_wrapper">
      <state-table-object
        v-for="stop in stops"
        :id="stop.id"
        :key="stop.id"
        type="stop"
      />
    </div>

    <div class="table_wrapper">
      <state-table-object
        v-for="user in users"
        :id="user.id"
        :key="user.id"
        type="male"
      />
    </div>

    <div class="table_wrapper"></div>
  </div>
</template>

<script>
import StateTableObject from "./StateTableObject.vue";

export default {
  name: "StateTable",
  components: {
    StateTableObject
  },
  computed: {
    stops() {
      return this.$store.getters["mapObjects/getStops"];
    },
    vehicles() {
      return this.$store.getters["mapObjects/getVehicles"];
    },
    users() {
      return this.$store.getters["mapObjects/getUsers"];
    }
  }
};
</script>

<style scoped>
.table_wrapper {
  display: flex;
}

#table_container {
  display: grid;
  grid-template-columns: auto auto auto auto;
  height: 30vh;
  margin-top: 20px;
  border: solid 2px black;
  border-radius: 5px;
}
</style>
