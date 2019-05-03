import Vue from "vue";
import App from "./App.vue";
import store from "./stores/store";
import VueSocketIO from "vue-socket.io";
import BootstrapVue from "bootstrap-vue";
import VueResource from "vue-resource";
import router from "./router";
import VueQrcodeReader from "vue-qrcode-reader";

// import bootstrap globally
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.config.productionTip = false;

Vue.prototype.$hostname = `${window.location.protocol}//${
  window.location.hostname
}:${process.env.VUE_APP_BACKEND_PORT}`;

const osmHost = process.env.VUE_APP_OSM_HOST === "window.location" ? window.location.hostname : process.env.VUE_APP_OSM_HOST;
Vue.prototype.$osm = `${process.env.VUE_APP_OSM_PROTOCOL}://${osmHost}:${process.env.VUE_APP_OSM_PORT}${process.env.VUE_APP_OSM_PATH}`

// enable http requests
Vue.use(VueResource);

Vue.use(BootstrapVue);

Vue.use(VueQrcodeReader);

Vue.use(
  new VueSocketIO({
    debug: false,
    connection: Vue.prototype.$hostname,
    vuex: {
      store,
      actionPrefix: "SOCKET_",
      mutationPrefix: "SOCKET_"
    }
  })
);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
