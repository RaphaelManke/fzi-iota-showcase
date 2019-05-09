<template>
    <b-container fluid>
        <b-row class="mt-4">
            <b-col>
                <b-card id="routecard" header="Selected Route">
                    <b-row align-h="center" class="text-center">
                        <template align-self="center" v-for="(section, index) in selectedRoute.sections">
                            
                                <b-col :id="section.from" class="mt-2">
                                {{getStop(section.from).name}}
                                </b-col>
                                <b-col>
                                    
                                        <img :src="getImageSrc(section.vehicle.type)"/>
                                    
                                <b-progress :max="section.duration" :value="section.passed_count" variant="success" :striped="internTrue"></b-progress>
                                    
                                </b-col>
                                <b-col v-if="section.to===destination" :id="section.to" class="mt-2">
                                {{getStop(section.to).name}}
                                </b-col>
                                <b-popover :show.sync="showResume&&!nextTrip&&!userInfo.trip&&currentStopId===section.from" :target="section.from" placement="top" title="Resume Route?">
        <div style="text-align: center;"><b-button variant="primary" @click="resumeRoute">Resume</b-button></div>
      </b-popover>
      <b-popover :show.sync="nextTrip&&currentStopId===section.from" :target="section.from" placement="top" title="Waiting for next step">
        <b-spinner style="height: 18px; width: 18px;" variant="primary" label="RouteState"></b-spinner>{{routeState}}
      </b-popover>
      <b-popover v-if="destination===section.to" :show.sync="!userInfo.trip&&currentStopId===destination" :target="section.to" placement="top" title="Route ended">
        <b-button variant="primary" @click="finishRoute">Finish route</b-button>
      </b-popover>
                            
                        </template>
                        
                    </b-row>
                </b-card>
            </b-col>
        </b-row>
        <b-row class="mt-4">
      <b-col>
        <b-card header="Map" style="height: 100%">
        <map-visu style="height: 40vh"/>
        </b-card>
      </b-col>
      <b-col>
          <b-card no-body>
          <b-tabs card>
              <!-- Events view -->
          <b-tab title="Events">
            <div style="height: 40vh">
              <div style="height: 100%; overflow-y: scroll; overflow-x: hidden;"
              id="eventList"
      ref="eventList"
      @mouseover="mouseOnEvents = true"
      @mouseleave="mouseOnEvents = false"
              >
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="event in events" class="d-flex justify-content-between align-items-center">
          <div v-if="event.type==='tripStarted'">Trip from {{getStop(event.info.start).name}} to {{getStop(event.info.destination).name}} started</div>
          <div v-if="event.type==='tripFinished'">Arrived at {{getStop(event.info.destination).name}}</div>
          <div v-if="event.type==='payment'"><b-badge variant="primary" pill>{{formatIota(event.info.amount)}}<img src="assets/images/iota.png"/></b-badge> transfered to {{getVehicleById(event.info.to).name}}</div>
          <b-badge variant="light" pill>{{event.time}}</b-badge>
      </b-list-group-item>
    </b-list-group>
    </b-col>
    </b-row>
    </div>
        </div>
        </b-tab>
        <!-- Route options view-->
                <b-tab title="Route Options" @click="refreshRoutes">
            <div style="height: 40vh">
              <div style="height: 80%; overflow-y: scroll; overflow-x: hidden;">
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="(route, index) in routes" :active="index===selectedRouteIndex" @click="selectedRouteIndex=index" :button="internTrue" class="d-flex justify-content-between align-items-center">
          <b-container>
          <b-row>
            <template v-for=" section in route.sections">
                <b-col md="auto" style="padding: 0 5px" class="no-space-break">{{getStop(section.from).name}}</b-col><b-col md="auto" style="padding: 0 5px"><img :src="getImageSrc(section.vehicle.type)"/></b-col> <b-col md="auto" style="padding: 0 5px" class="no-space-break" v-if="section.to===destination">{{getStop(section.to).name}}</b-col>
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
    <b-button block variant='primary' @click="refreshRoutes">Refresh</b-button>
    </b-col>
    <b-col>
    <b-button :disabled="userInfo.trip||currentStopId===destination||disableChange" block variant='warning' @click="changeRoute">Change</b-button>
    </b-col>
    <b-col id="haltNextStopButton">
    <b-button v-if="haltAtNextStopShow" block variant='primary' @click="finishRoute">Finish</b-button>
    <b-button v-else block variant='danger' @click="haltAtNextStop">Stop</b-button>
    <b-popover placement="top" target="haltNextStopButton" :show.sync="haltAtNextStopShow" title="Next Stop">{{currentStop.name}}</b-popover>
    </b-col>
        </b-row>
        </div>
        </b-tab>       
        </b-tabs>
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
      mouseOnEvents: false,
      selectedRouteIndex: -1,
      haltAtNextStopShow: false,
      internTrue: true,
      showResume: true,
      disableChange: false
    };
  },
  computed: {
    routeState() {
      return this.$store.getters["routes/getRouteState"];
    },
    userInfo() {
      return this.$store.getters["user/getUserInfo"];
    },
    events() {
      let currEvents = this.$store.getters["events/getEvents"].filter(
        el => el.relId === this.userInfo.id
      );
      /* no idea why this code does not work
      if (currEvents.length > 20 && !this.mouseOnEvents) {
        currEvents.shift();
      }*/
      return currEvents;
    },
    routes() {
      return this.$store.getters["routes/getRoutesAvailable"].filter(
        route => route.sections.length < 4
      );
    },
    selectedRoute() {
      return this.$store.getters["routes/getRouteSelected"];
    },
    currentStop() {
      return this.$store.getters["mapObjects/getStopById"](
        this.$store.getters["user/getCurrentStopId"]
      );
    },
    currentStopId() {
      return this.$store.getters["user/getCurrentStopId"];
    },
    destination() {
      return this.$store.getters["user/getDestination"];
    },
    nextTrip() {
      return this.$store.getters["routes/getNextTrip"];
    }
  },
  updated() {
    if (!this.mouseOnEvents) {
      this.$refs.eventList.scrollTop = this.$refs.eventList.scrollHeight;
    }
  },
  methods: {
    formatIota(iotas) {
      return formatIota(iotas);
    },
    haltAtNextStop() {
      this.$http
        .post(this.$hostname + "/stopTripAtNextStop", {
          seed: this.$store.getters["user/getSeed"]
        })
        .then(function(response) {
          if (response.status === 200) {
            this.$store.commit("user/updateCurrentStop", response.body);
            this.refreshRoutes();
            this.haltAtNextStopShow = true;
          }
        })
        .catch(function(response) {
          window.console.log(response);
        });
    },
    changeRoute() {
      if (this.$store.getters["user/getUserInfo"].trip === undefined) {
        this.disableChange = true;
        this.$store.commit(
          "routes/updateRouteSelected",
          this.routes[this.selectedRouteIndex]
        );
        this.resumeRoute();
        this.haltAtNextStopShow = false;
      } else {
        alert("Wait till arrival to change the route");
      }
    },
    finishRoute() {
      this.$store.commit("user/routeFinished");
      this.$store.commit("routes/routeFinished");
      this.$store.commit("events/routeFinished");
      this.$router.push("route-selection");
    },
    getNextTrip() {
      let trip = undefined;
      try {
        trip = this.$store.getters["routes/getRouteSelected"].sections.find(
          section =>
            section.from === this.$store.getters["user/getCurrentStopId"]
        );
      } catch (err) {
        window.console.error(err);
        return undefined;
      }
      if (trip === undefined) return undefined;
      return {
        seed: this.$store.getters["user/getSeed"],
        vehicle: trip.vehicle.id,
        start: trip.from,
        destination: trip.to,
        intermediateStops: trip.intermediateStops
      };
    },
    resumeRoute() {
      this.showResume = false;
      var trip = this.getNextTrip();
      if (trip !== undefined) {
        this.$http
          .post(this.$hostname + "/trip", trip)
          .then(function(response) {
            this.showResume = true;
            this.disableChange = false;
          })
          .catch(function(response) {
            this.refreshRoutes();
            if (response.status === 400) {
              // wait for vehicle
              this.showResume = true;
              this.disableChange = false;
              this.$store.commit("routes/setNextTrip", trip);
            } else window.console.log(response);
            vm.$forceUpdate();
          });
      } else {
        this.refreshRoutes();
        alert("Trip not definded. \n Please select another route!");
        this.showResume = true;
        this.disableChange = false;
      }
    },
    getStop(id) {
      return this.$store.getters["mapObjects/getStopById"](id);
    },
    getImageSrc(imageType) {
      return "assets/images/" + imageType + ".png";
    },
    refreshRoutes() {
      if (
        this.$store.getters["user/getUserInfo"].stop !==
        this.$store.getters["user/getDestination"]
      ) {
        this.$http
          .get(this.$hostname + "/routes", {
            params: {
              start: this.$store.getters["user/getUserInfo"].stop,
              destination: this.$store.getters["user/getDestination"]
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
    },
    getVehicleById(id) {
      return this.$store.getters["mapObjects/getVehicleById"](id);
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


