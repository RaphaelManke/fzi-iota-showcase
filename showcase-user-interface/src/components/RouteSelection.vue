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
       <b-alert
      :show="dismissCountDown"
      dismissible
      variant="warning"
      @dismissed="dismissCountDown=0"
      @dismiss-count-down="countDownChanged"
    >
      Please select a destination and route!
    </b-alert>
    <b-row class="mt-4">
      <b-col cols=8>
        <b-card header="Map">
        <map-visu style="height: 40vh"/>
        </b-card>
      </b-col>
      <b-col>
          <b-card header="Route Options">
            <div style="height: 40vh">
              <div style="height: 80%; overflow-y: scroll">
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="route in routes" :active="route.id===selectedRouteId"
      @click="selectedRouteId=route.id" button=true class="d-flex justify-content-between align-items-center">
          <b-row>
            <b-col v-for=" section in route.sections">
                {{section.from}} <img :src="getImageSrc(section.vehicle.type)"/> {{section.to}}
            </b-col>
          </b-row>
          <b-badge variant="primary" pill>
            {{routePrice(route.sections)}} 
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
        this.$http
          .get(this.$hostname + "/routes", {
            params: {
              start: this.currentStop,
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
    selectedRouteId: {
      get() {
        return this.$store.getters["routes/getRouteSelectedId"];
      },
      set(value) {
        this.$store.commit("routes/updateRouteSelectedId", value);
      }
    }
  },
  methods: {
    getImageSrc(imageType) {
      return "assets/images/" + imageType + ".png";
    },
    showNoRouteAlert() {
      this.dismissCountDown = this.dismissSecs;
    },
    submitRoute() {
      if (this.selectedRouteId !== "") {
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
    }
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
</style>

