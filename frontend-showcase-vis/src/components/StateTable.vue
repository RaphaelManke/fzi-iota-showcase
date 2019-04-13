<template>
  <b-card style="height: 30vh">
    <b-row>
    <b-col>
      <div class="table_wrapper">
      <state-table-object
        v-for="vehicle in vehicles"
        :id="vehicle.id"
        :key="vehicle.id"
        :type="vehicle.info.type"
      />
      </div>
    </b-col>

    <!--<b-col>
      <state-table-object
        v-for="stop in stops"
        :id="stop.id"
        :key="stop.id"
        type="stop"
      />
    </b-col>-->

    <b-col>
      <div class="table_wrapper">
      <state-table-object
        v-for="user in users"
        :id="user.id"
        :key="user.id"
        type="male"
      />
      </div>
    </b-col>
    </b-row>
  </b-card>
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
</style>
