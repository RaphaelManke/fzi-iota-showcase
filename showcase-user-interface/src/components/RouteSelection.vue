<template>
  <b-container fluid>
        <b-row class="mt-4">
        <b-col>
            <b-card header="Start/Stop Station">
                <b-form-group>
                    <b-row>
                    <b-col>
                    Start
                    <b-form-select v-model="currentStop.id" :options="[currentStop]"
                    value-field="id" text-field="name" disabled=true
                    ></b-form-select>
                    </b-col>
                    <b-col>
                    Stop
                    <b-form-select v-model="selectedDestination" :options="stops"
                    value-field="id" text-field="name"
                    ></b-form-select>
                    </b-col>
                    </b-row>
                </b-form-group>
            </b-card>
       </b-col>
       </b-row>
    <b-row class="mt-4">
      <b-col cols=8>
        <b-card header="Map">
        <map-visu />
        </b-card>
      </b-col>
      <b-col>
          <b-card header="Route Options">
            <div style="height: 40vh">
              <div style="height: 80%; overflow-y: scroll">
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="route in routes" :active="route.id===selectedRoute"
      @click="selectedRoute=route.id" button=true class="d-flex justify-content-between align-items-center">
          {{route.route}}
          <b-badge variant="primary" pill>14</b-badge>
      </b-list-group-item>
    </b-list-group>
    </b-col>
    </b-row>
    </div>
    <b-row class="text-center mt-4">
      <b-col>
    <b-button variant='primary' @click='submitRoute' style="width: 100%">GO!</b-button>
       </b-col>
        </b-row>
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
    routes() {
      return this.$store.getters["routes/getRoutesAvailable"];
    },
    stops() {
      return this.$store.getters["mapObjects/getStops"];
    },
    currentStop() {
      return this.$store.getters["mapObjects/getStopById"](
        this.$store.getters["user/getUserInfo"].stop
      );
    },
    selectedDestination: {
      get() {
        return this.$store.getters["user/getDestination"];
      },
      set(value) {
        this.$store.commit("user/updateDestination", value);
      }
    },
    selectedRoute: {
      get() {
        return this.$store.getters["routes/getRouteSelected"];
      },
      set(value) {
        this.$store.commit("routes/updateRouteSelected", value);
      }
    },
    routeVisu(route) {
      let result = "";
      route.forEach(element => {
        result += element + " - ";
      });
      return result;
    }
  },
  methods: {
    submitRoute() {
      this.$router.push("route-observer");
    }
  }
};
</script>
