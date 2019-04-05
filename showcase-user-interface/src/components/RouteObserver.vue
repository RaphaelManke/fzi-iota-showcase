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
                        
                            <b-button @click="changeRoute" v-b-toggle.collapse-1 variant="primary">{{changeRouteButtonText()}}</b-button>
                        
                    </b-row>
                </b-card>
            </b-col>
        </b-row>
        <b-row class="mt-4">
      <b-col>
          <!-- Map View -->
        <b-card header="Map">
        <map-visu style="height: 40vh"/>
        </b-card>
      </b-col>
      <b-col>
          <!-- Collapsable route options view-->
          <b-collapse class="mb-4" id="collapse-1">
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
    <b-button v-b-toggle.collapse-1 block variant='primary' @click='submitRoute'>GO!</b-button>
       </b-col>
        </b-row>
        </div>
        </b-card>       
            </b-collapse>
            <!-- Events view -->
          <b-card  v-if="!changingRoute" header="Events">
            <div style="height: 40vh">
              <div style="height: 100%; overflow-y: scroll"
              id="eventList"
      ref="eventList"
      @mouseover="mouseOnEvents = true"
      @mouseleave="mouseOnEvents = false"
              >
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="event in events" class="d-flex justify-content-between align-items-center">
          {{event.type}} {{event.info}}
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
  data() {
    return {
      changingRoute: false,
      mouseOnEvents: false
    };
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
    },
    currentStop() {
      return this.$store.getters["mapObjects/getStopById"](
        this.$store.getters["user/getUserInfo"].stop
      );
    }
  },
  updated() {
    if (!this.mouseOnEvents) {
      this.$refs.eventList.scrollTop = this.$refs.eventList.scrollHeight;
    }
  },
  methods: {
    changeRouteButtonText() {
      if (this.changingRoute) {
        return "Resume observe";
      } else {
        return " Change route ";
      }
    },
    getImageSrc(imageType) {
      return "assets/images/" + imageType + ".png";
    },
    changeRoute() {
      this.changingRoute = !this.changingRoute;
      if (changeRoute) {
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
    routePrice(sections) {
      let summedPrice = 0;
      sections.forEach(element => {
        summedPrice += element.price;
      });
      return summedPrice;
    },
    submitRoute() {
      if (this.selectedRouteId !== "") {
        this.changingRoute = !this.changingRoute;
      } else {
        this.showNoRouteAlert();
      }
    }
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
</style>


