<template>
  <b-card header="Active Trips" style="height:100%">
    <div style="height: 60vh; overflow-y: scroll; overflow-x: hidden;">
            <b-row>
              <b-col>

      <b-card v-for="user in tripinUsers" :header="getHeader(user)">
        <b-row align-h="center">
          <b-col class="no-space-break text-center">{{getStopById(user.trip.start).name}}</b-col><b-col class="text-center" cols="1"><b-spinner style="height: 18px; width: 18px;" variant="primary" label="Moving.."></b-spinner></b-col><b-col class="no-space-break text-center">{{getStopById(user.trip.destination).name}}</b-col>
        </b-row>
      </b-card>

    </b-col>
    </b-row>
    </div>
  </b-card>
</template>

<script>
export default {
  name: "RouteList",
  computed: {
    tripinUsers() {
      return this.$store.getters["mapObjects/getUsers"].filter(
        user => user.trip !== undefined
      );
    }
  },
  methods: {
    formatIota(iotas) {
      if (iotas > 1000000000) return (iotas / 1000000000).toFixed(2) + " Gi";
      if (iotas > 1000000) return (iotas / 1000000).toFixed(2) + " Mi";
      if (iotas > 1000) return (iotas / 1000).toFixed(2) + " Ki";
      return iotas + " i";
    },
    getStopById(id) {
      return this.$store.getters["mapObjects/getStopById"](id);
    },
    getHeader(user) {
      return (
        user.name +
        " with " +
        this.$store.getters["mapObjects/getVehicleById"](user.trip.vehicleId)
          .name
      );
    }
  }
};
</script>

