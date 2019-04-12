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
              <div style="height: 80%; overflow-y: scroll">
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="(route, index) in routes" :active="index===selectedRouteIndex"
      @click="selectedRouteIndex=index" button=true class="d-flex justify-content-between align-items-center">
          <b-row>
            <b-col v-for=" section in route.sections">
                {{getStop(section.from).name}} <img :src="getImageSrc(section.vehicle.type)"/> {{getStop(section.to).name}}
            </b-col>
          </b-row>
          <b-badge variant="primary" pill>
            {{formatIota(routePrice(route.sections))}} 
            <img src="assets/images/iota.png"/>
          </b-badge>
      </b-list-group-item>
    </b-list-group>
    </b-col>
    </b-row>
    </div>
    <b-row class="text-center mt-4">
      <b-col>
    <b-button block variant='primary' @click='submitRoute'>GO!</b-button>
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
  data() {
    return {
      dismissSecs: 5,
      dismissCountDown: 0
    };
  },
  computed: {
    routes() {
      return this.$store.getters["routes/getRoutesAvailable"];
    },
    stops() {
      return this.$store.getters["mapObjects/getStops"].filter(
        dest => dest.id !== this.$store.getters["user/getCurrentStopId"]
      );
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
    },
    selectedRouteIndex: {
      get() {
        return this.$store.getters["routes/getRouteSelectedIndex"];
      },
      set(value) {
        this.$store.commit("routes/updateRouteSelected", value);
      }
    }
  },
  methods: {
    formatIota(iotas) {
      if (iotas > 1000000000) return (iotas / 1000000000).toFixed(2) + "Gi";
      if (iotas > 1000000) return (iotas / 1000000).toFixed(2) + "Mi";
      if (iotas > 1000) return (iotas / 1000).toFixed(2) + "Ki";
      return iotas;
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
      var trip = this.getNextTrip();
      if (trip !== undefined) {
        this.$http
          .post(this.$hostname + "/trip", trip)
          .then(function(response) {
            if (response.status === 200) {
              this.$router.push("route-observer");
            }
          })
          .catch(function(response) {
            window.console.log(response);
          });
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
    }
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
</style>

