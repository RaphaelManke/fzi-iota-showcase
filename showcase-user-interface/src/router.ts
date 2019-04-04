import Vue from "vue";
import VueRouter from "vue-router";
import Store from "./stores/store";

// import router components
import Login from "./components/Login.vue";
import RouteSelection from "./components/RouteSelection.vue";
import RouteObserver from "./components/RouteObserver.vue";

Vue.use(VueRouter);

const loginNecessary = (to: any, from: any, next: any) => {
  // If Store.getters.authenticated === null, the store isn't yet initialized and the user would be redirected to
  // '/dashboard' upon page refresh all the time.
  if (Store.getters["user/isLoggedIn"] === false && to.path !== "/") next("/");
  else next();
};

export default new VueRouter({
  routes: [
    { path: "/", component: Login },
    {
      path: "/route-selection",
      component: RouteSelection,
      beforeEnter: loginNecessary
    },
    {
      path: "/route-observer",
      component: RouteObserver,
      beforeEnter: loginNecessary
    }
  ]
});
