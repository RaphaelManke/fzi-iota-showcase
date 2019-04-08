<template>
    <b-container fluid>
        <b-row class="mt-4">
            <b-col>
                <b-card header="Selected Route">
                    <b-row align-h="center" class="text-center">
                        <b-col align-self="center" v-for="(section, index) in selectedRoute.sections">
                            <b-row>
                                <b-col class="mt-2">
                                {{getStop(section.from).name}}
                                </b-col>
                                <b-col>
                                    
                                        <img :src="getImageSrc(section.vehicle.type)"/>
                                    
                                <b-progress :max="section.price" :value="0.25*section.price" variant="success" striped=true></b-progress>
                                    
                                </b-col>
                                <b-col class="mt-2">
                                {{getStop(section.to).name}}
                                </b-col>
                            </b-row>
                        </b-col>
                        
                    </b-row>
                </b-card>
            </b-col>
        </b-row>
        <b-row class="mt-4">
      <b-col>
          <!-- Map View -->
          <b-card no-body>
          <b-tabs card>
        <b-tab title="Map">
        <map-visu style="height: 40vh"/>
        </b-tab>
        </b-tabs>
        </b-card>
      </b-col>
      <b-col>
          <!-- Collapsable route options view-->
          <b-card no-body>
          <b-tabs card>
                <b-tab title="Route Options" @click="refreshRoutes">
            <div style="height: 40vh">
              <div style="height: 80%; overflow-y: scroll; overflow-x: hidden;">
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="route in routes" :active="route.id===locallySelectedRouteId" @click="locallySelectedRouteId=route.id" button=true class="d-flex justify-content-between align-items-center">
          <b-row>
            <b-col v-for=" section in route.sections">
                {{getStop(section.from).name}} <img :src="getImageSrc(section.vehicle.type)"/> {{getStop(section.to).name}}
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
    <b-button block variant='primary' @click="selectedRouteId=locallySelectedRouteId">Change route</b-button>
       </b-col>
        </b-row>
        </div>
        </b-tab>       
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
          {{event.type}} {{event.info}}
      </b-list-group-item>
    </b-list-group>
    </b-col>
    </b-row>
    </div>
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
      locallySelectedRouteId: this.selectedRouteId
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
      return this.$store.getters["routes/getRouteSelected"];
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
  mounted() {
    map.invalidateSize();
  },
  methods: {
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


