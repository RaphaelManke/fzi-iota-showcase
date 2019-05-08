<template>

<b-row no-gutters="true">
    <b-col v-for="transaction in transactionData" style="height: 100%">
      <transition appear name="slide-fade" mode="out-in">
        <b-card :header-bg-variant="getTypeVariant(transaction.type)" style="height: 100%" :key="transaction.time+transaction.address+transaction.from">
          <b-row align-h="end" slot="header">
            <b-col>{{transaction.type}}</b-col>
            <b-col align="right"><b-badge variant="light">{{transaction.time}}</b-badge></b-col>
          </b-row>
          <b-row>
          <b-col>Address: <b-badge>{{formatAddress(transaction.address)}}</b-badge></b-col>
          </b-row>
          <b-row>
          <b-col>Amount: <b-badge :variant="getAmoutVariant(transaction.value)">{{formatIota(transaction.value)}}<img src="assets/images/iota.png"/></b-badge></b-col>
          </b-row>
          <b-row>
          <b-col v-if="transaction.type === 'checkIn' | transaction.type === 'departed'">Stop: <b-badge>{{getStopById(transaction.stop).name}}</b-badge></b-col>
          <b-col v-if="transaction.type === 'value'"><b-badge>{{getNameById(transaction.from)}}</b-badge>-><b-badge>{{getNameById(transaction.to)}}</b-badge></b-col>
          </b-row>

            </b-card>
      </transition>
    </b-col>
</b-row>
    
</template>

<script>
export default {
  name: "TanglePanel",
  computed: {
    transactionData() {
      return this.$store.getters["transactions/getTransactions"];
    }
  },
  methods: {
    formatAddress(address) {
      return address.slice(0, 18) + "...";
    },
    getNameById(id) {
      let vehicle = this.$store.getters["mapObjects/getVehicleById"](id);
      let user = this.$store.getters["mapObjects/getUserById"](id);
      if (vehicle) return vehicle.name;
      if (user) return user.name;
      return id;
    },
    getUserById(id) {
      return this.$store.getters["mapObjects/getUserById"](id);
    },
    getStopById(id) {
      return this.$store.getters["mapObjects/getStopById"](id);
    },
    formatIota(iotas) {
      if (iotas > 1000000000) return (iotas / 1000000000).toFixed(2) + " Gi";
      if (iotas > 1000000) return (iotas / 1000000).toFixed(2) + " Mi";
      if (iotas > 1000) return (iotas / 1000).toFixed(2) + " Ki";
      return iotas + " i";
    },
    getAmoutVariant(amount) {
      if (amount > 0) return "success";
      else return "primary";
    },
    getTypeVariant(type) {
      switch (type) {
        case "checkIn":
          return "warning";
        case "value":
          return "success";
        case "departed":
          return "danger";
        default:
          return "light";
      }
    }
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
p {
  margin-bottom: 0;
}
.slide-fade-enter-active {
  transition: all 0.5s ease;
}
.slide-fade-leave-active {
  transition: all 0.5s ease;
}
.slide-fade-enter {
  transform: translateX(12vw);
}

.slide-fade-leave-to {
  transform: translateX(-12vw);
}
</style>

