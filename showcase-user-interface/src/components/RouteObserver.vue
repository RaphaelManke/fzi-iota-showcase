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
                                <b-popover :show.sync="!userInfo.trip&&currentStopId===section.from" :target="section.from" placement="top" title="Resume Route?">
        <b-button variant="primary" @click="resumeRoute">Resume</b-button>
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
          <div v-if="event.type==='transaction'">{{formatIota(event.info.amount)}} transfered</div>
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
      <b-list-group-item v-for="(route, index) in routes" :active="index===locallySelectedRouteIndex" @click="locallySelectedRouteIndex=index" :button="internTrue" class="d-flex justify-content-between align-items-center">
          <b-row>
            <template v-for=" section in route.sections">
                <b-col class="no-space-break">{{getStop(section.from).name}}</b-col><b-col><img :src="getImageSrc(section.vehicle.type)"/></b-col> <b-col class="no-space-break" v-if="section.to===destination">{{getStop(section.to).name}}</b-col>
            </template>
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
    <b-button block variant='primary' @click="refreshRoutes">Refresh routes</b-button>
    </b-col>
    <b-col>
    <b-button block variant='warning' @click="changeRoute">Change route</b-button>
    </b-col>
    <b-col id="haltNextStopButton">
    <b-button v-if="haltAtNextStopShow" block variant='primary' @click="finishRoute">Finish route</b-button>
    <b-button v-else block variant='danger' @click="haltAtNextStop">Halt at next Stop</b-button>
    <b-popover placement="top" target="haltNextStopButton" :show.sync="haltAtNextStopShow" title="Next stop:">{{currentStop.name}}</b-popover>
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
export default {
  components: {
    MapVisu
  },
  data() {
    return {
      mouseOnEvents: false,
      locallySelectedRouteIndex: 0,
      haltAtNextStopShow: false,
      internTrue: true
    };
  },
  created() {
    this.locallySelectedRouteIndex = this.selectedRouteIndex;
  },
  computed: {
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
      return this.$store.getters["routes/getRoutesAvailable"];
    },
    selectedRouteIndex: {
      get() {
        return this.$store.getters["routes/getRouteSelectedIndex"];
      },
      set(value) {
        this.$store.commit("routes/updateRouteSelected", value);
      }
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
    }
  },
  updated() {
    if (!this.mouseOnEvents) {
      this.$refs.eventList.scrollTop = this.$refs.eventList.scrollHeight;
    }
  },
  methods: {
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
          alert("Server error. PLease look in console!");
          window.console.log(response);
        });
    },
    formatIota(iotas) {
      if (iotas > 1000000000) return (iotas / 1000000000).toFixed(0) + " Gi";
      if (iotas > 1000000) return (iotas / 1000000).toFixed(0) + " Mi";
      if (iotas > 1000) return (iotas / 1000).toFixed(0) + " Ki";
      return iotas + " i";
    },
    changeRoute() {
      if (this.$store.getters["user/getUserInfo"].trip === undefined) {
        this.selectedRouteIndex = this.locallySelectedRouteIndex;
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
      var trip = this.getNextTrip();
      if (trip !== undefined) {
        this.$http
          .post(this.$hostname + "/trip", trip)
          .catch(function(response) {
            window.console.log(response);
          });
      } else {
        this.refreshRoutes();
        alert("Trip not definded. \n Please select another route!");
      }
    },
    getStop(id) {
      return this.$store.getters["mapObjects/getStopById"](id);
    },
    getImageSrc(imageType) {
      return "assets/images/" + imageType + ".png";
    },
    refreshRoutes() {
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
    },
    routePrice(sections) {
      let summedPrice = 0;
      sections.forEach(element => {
        summedPrice += element.price;
      });
      return summedPrice;
    },
    showResumeRouteAlert() {}
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
</style>


