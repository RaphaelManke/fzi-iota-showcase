<template>
  <b-card header="Routes">
    <div style="height: 60vh; overflow-y: scroll; overflow-x: hidden;">
            <b-row>
              <b-col>

      <b-card v-for="user in tripinUsers" :header="user.name">
          {{getStopById(user.trip.start).name}} <b-spinner style="height: 18px; width: 18px;" variant="primary" label="Moving.."></b-spinner> {{getStopById(user.trip.destination).name}}
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
    }
  }
};
</script>

