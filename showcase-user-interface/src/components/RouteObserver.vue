<template>
    <b-container fluid>
        <b-row class="mt-4">
            <b-col>
                <b-card header="Selected Route">
                    <b-row align-h="center" class="text-center">
                        <b-col align-self="center" v-for="(section, index) in selectedRoute.sections">
                            <b-row>
                                <b-col class="mt-2">
                                {{section.from}}
                                </b-col>
                                <b-col>
                                    
                                        <img :src="getImageSrc(section.vehicle.type)"/>
                                    
                                <b-progress :max="section.price" :value="0.25*section.price" variant="success" striped=true></b-progress>
                                    
                                </b-col>
                                <b-col class="mt-2">
                                {{section.to}}
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
  },
  methods: {
    getImageSrc(imageType) {
      return "assets/images/" + imageType + ".png";
    }
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
</style>


