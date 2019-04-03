<template>
  <b-container fluid>
        <b-row class="mt-4">
        <b-col>
            <b-card header="Start/Stop Station">
                <b-form-group>
                    <b-row>
                    <b-col>
                    <b-form-select v-model="selectedDestination" :options="stops"></b-form-select>
                    </b-col>
                    <b-col>
                    <b-form-select v-model="selectedDestination" :options="stops"></b-form-select>
                    </b-col>
                    </b-row>
                </b-form-group>
            </b-card>
       </b-col>
       </b-row>
    <b-row class="mt-4">
      <b-col>
        <b-card header="Map">
        <map-visu />
        </b-card>
      </b-col>
      <b-col>
          <b-card header="Route Options" style="height: 100%;">
              Options
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
    stops() {
      return this.$store.getters["mapObjects/getStops"].map(item => {
        return {
          text: item.name,
          value: item.id
        };
      });
    },
    selectedDestination: {
      get() {
        return this.$store.getters["user/getDestination"];
      },
      set(value) {
        this.$store.commit("user/updateDestination", value);
      }
    }
  }
};
</script>
