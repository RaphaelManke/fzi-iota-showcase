<template>
    <b-container fluid>
        <b-row class="mt-4">
            <b-col>
                <b-card header="Selected Route">
                    <b-row align-h="center" class="text-center">
                        <b-col align-self="center" v-for="(stop, index) in selectedRoute.route">
                            <b-row>
                                <b-col align-self="center">{{stop}}</b-col>
                                <b-col align-self="center">
                                    <b-progress v-if="index + 1 < selectedRoute.route.length" :value="25" variant="success" striped=true></b-progress>
                                </b-col>
                            </b-row>
                        </b-col>
                        
                            <b-button variant="primary">Change Route</b-button>
                        
                    </b-row>
                </b-card>
            </b-col>
        </b-row>
        <b-row class="mt-4">
      <b-col>
        <b-card header="Map">
        <map-visu style="height: 40vh"/>
        </b-card>
      </b-col>
      <b-col>
          <b-card header="Events">
            <div style="height: 40vh">
              <div style="height: 80%; overflow-y: scroll">
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="route in routes" :active="route.id===selectedRouteId"
      @click="selectedRouteId=route.id" button=true class="d-flex justify-content-between align-items-center">
          {{route.route}}
          <b-badge variant="primary" pill>14</b-badge>
      </b-list-group-item>
    </b-list-group>
    </b-col>
    </b-row>
    </div>
        </div>
        </b-card>
      </b-col>
      </b-row>
    </b-container>
</template>

<script>
import MapVisu from "./MapVisu";
export default {
  components: {
    MapVisu
  },
  computed: {
    selectedRouteId: {
      get() {
        return this.$store.getters["routes/getRouteSelectedId"];
      },
      set(value) {
        this.$store.commit("routes/updateRouteSelectedId", value);
      }
    },
    selectedRoute() {
      return this.$store.getters["routes/getRouteById"](this.selectedRouteId);
    }
  }
};
</script>

<style>
</style>


