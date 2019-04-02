import Vue from "vue";
import App from "./App.vue";
import store from "./stores/store";
import VueSocketIO from "vue-socket.io";
import VueRouter from "vue-router";

import Login from "./components/Login.vue";
import RouteSelection from "./components/RouteSelection.vue";

Vue.config.productionTip = false;

Vue.use(
  new VueSocketIO({
    debug: true,
    connection: "http://localhost:3000",
    vuex: {
      store,
      actionPrefix: "SOCKET_",
      mutationPrefix: "SOCKET_"
    }
  })
);

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    { path: "/", component: Login },
    { path: "/route-selection", component: RouteSelection }
  ]
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
