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
                    Destination
                    <b-form-select v-model="selectedDestination" :options="stops"
                    value-field="id" text-field="name"
                    ></b-form-select>
                    </b-col>
                    <b-col md="auto">
                      <b-form-group label="Vehicle types">
      <b-form-checkbox-group v-model="vehicleTypes">
        <b-form-checkbox value="car">Car</b-form-checkbox>
        <b-form-checkbox value="tram">Tram</b-form-checkbox>
        <b-form-checkbox value="bike">Bike</b-form-checkbox>
      </b-form-checkbox-group>
    </b-form-group>
                    </b-col>
                    </b-row>
                </b-form-group>
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
        <b-alert
      :show="dismissCountDown"
      dismissible
      variant="warning"
      @dismissed="dismissCountDown=0"
      @dismiss-count-down="countDownChanged"
      style="position: fixed; z-index: 9999;"
    >
      Please select a destination and route!
    </b-alert>
          <b-card header="Route Options">
            <div style="height: 40vh">
              <div style="height: 80%; overflow-y: auto; overflow-x: hidden;">
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="(route, index) in routes" :active="index===selectedRouteIndex"
      @click="selectedRouteIndex=index" button=true class="d-flex justify-content-between">
          <b-container>
          <b-row>
            <template v-for=" section in route.sections">
                <b-col md="auto" style="padding: 0 5px" class="no-space-break">{{getStop(section.from).name}}</b-col><b-col md="auto" style="padding: 0 5px"><img :src="getImageSrc(section.vehicle.type)"/></b-col> <b-col md="auto" style="padding: 0 5px" class="no-space-break" v-if="section.to===selectedDestination">{{getStop(section.to).name}}</b-col>
            </template>
          </b-row>
          <b-row class="mt-1">
            <b-col>
              Price: 
          <b-badge variant="primary" pill>
            {{formatIota(routePrice(route.sections))}} 
            <img src="assets/images/iota.png"/>
          </b-badge>
          </b-col>
          <b-col>
            Duration: 
          <b-badge variant="light" pill>
            {{routeDuration(route.sections)}} s
          </b-badge>
          </b-col>
          </b-row>
          </b-container>
      </b-list-group-item>
    </b-list-group>
    </b-col>
    </b-row>
    </div>
    <b-row class="text-center">
      <b-col>
    <b-button id="go_button" block variant='primary' @click='submitRoute'>GO!</b-button>
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
import { formatIota } from "../utils";

export default {
  components: {
    MapVisu
  },
  data() {
    return {
      dismissSecs: 5,
      dismissCountDown: 0,
      vehicleTypes: ["car", "tram", "bike"],
      selectedRouteIndex: -1
    };
  },
  computed: {
    routes() {
      return this.$store.getters["routes/getRoutesAvailable"].filter(route => {
        let res = true;
        if (route.sections.length > 3) return false;
        route.sections.forEach(section => {
          if (!this.vehicleTypes.includes(section.vehicle.type)) res = false;
        });
        return res;
      });
    },
    stops() {
      return this.$store.getters["mapObjects/getStops"]
        .filter(
          dest => dest.id !== this.$store.getters["user/getCurrentStopId"]
        )
        .sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
    },
    currentStop() {
      return this.$store.getters["mapObjects/getStopById"](
        this.$store.getters["user/getCurrentStopId"]
      );
    },
    selectedDestination: {
      get() {
        return this.$store.getters["user/getDestination"];
      },
      set(value) {
        this.$store.commit("user/updateDestination", value);
        this.$http
          .get(this.$hostname + "/routes", {
            params: {
              start: this.$store.getters["user/getUserInfo"].stop,
              destination: value
            }
          })
          .then(function(response) {
            if (response.status === 200) {
              this.$store.commit("routes/updateRoutesAvailable", response.body);
            }
          })
          .catch(function(response) {
            window.console.log(response);
          });
      }
    }
  },
  methods: {
    formatIota(iotas) {
      return formatIota(iotas);
    },
    getNextTrip() {
      let trip = undefined;
      try {
        trip = this.$store.getters["routes/getRouteSelected"].sections.find(
          section =>
            section.from === this.$store.getters["user/getUserInfo"].stop
        );
      } catch (err) {
        return undefined;
      }
      return {
        seed: this.$store.getters["user/getSeed"],
        vehicle: trip.vehicle.id,
        start: trip.from,
        destination: trip.to,
        intermediateStops: trip.intermediateStops
      };
    },
    getStop(id) {
      return this.$store.getters["mapObjects/getStopById"](id);
    },
    getImageSrc(imageType) {
      return "assets/images/" + imageType + ".png";
    },
    showNoRouteAlert() {
      this.dismissCountDown = this.dismissSecs;
    },
    submitRoute() {
      this.$store.commit(
        "routes/updateRouteSelected",
        this.routes[this.selectedRouteIndex]
      );
      var trip = this.getNextTrip();
      if (trip !== undefined) {
        this.$http
          .post(this.$hostname + "/trip", trip)
          .catch(function(response) {
            if (response.status !== 400) {
              window.console.log(response);
            }
          });
        this.$store.commit("routes/setNextTrip", trip);
        this.$router.push("route-observer");
      } else {
        this.showNoRouteAlert();
      }
    },
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown;
    },
    routePrice(sections) {
      let summedPrice = 0;
      sections.forEach(element => {
        summedPrice += element.price;
      });
      return summedPrice;
    },
    routeDuration(sections) {
      let duration = 0;
      sections.forEach(element => {
        duration += element.duration;
      });
      return duration;
    }
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
.card-body {
  padding: 0.25rem 1.25rem;
}
.card-header {
  padding: 0.25rem 1.25rem;
}
</style>
