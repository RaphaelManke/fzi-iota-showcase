<template>
  <div id="table_container">
    <div class="table_wrapper">
      <state-table-object
        v-for="vehicle in vehicles"
        :key="vehicle.id"
        :id="vehicle.id"
        :type="vehicle.info.type"
      />
    </div>

    <div class="table_wrapper">
      <state-table-object v-for="stop in stops" :key="stop.id" :id="stop.id" type="stop"/>
    </div>

    <div class="table_wrapper"></div>

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
    }
  }
};
</script>

<style scoped>
.table_wrapper {
  display: flex;
  border: solid 1px gray;
}

#table_container {
  display: grid;
  grid-template-columns: auto auto auto auto;
  height: 30vh;
}
</style>


