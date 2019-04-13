import Vue from "vue";
import App from "./App.vue";
import store from "./stores/store";
import VueSocketIO from "vue-socket.io";
import VueResource from "vue-resource";
import BootstrapVue from "bootstrap-vue";

// import bootstrap globally
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.config.productionTip = false;

Vue.prototype.$hostname = process.env.VUE_APP_BACKEND_URL;

// enable http requests
Vue.use(VueResource);

Vue.use(BootstrapVue);

Vue.use(
  new VueSocketIO({
    debug: true,
    connection: Vue.prototype.$hostname,
    vuex: {
      store,
      actionPrefix: "SOCKET_",
      mutationPrefix: "SOCKET_"
    }
  })
);

new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
