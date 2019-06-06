import Vue from "vue";
import Router from "vue-router";
import Home from "@/components/Home";
import Search from "@/components/Search";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    },
    {
      path: "/search",
      name: "Search",
      component: Search,
      props: route => ({
        term: route.query.term || "",
        location: route.query.location || "90291",
        radius: route.query.radius || 1,
        limit: route.query.limit || 30,
      }),
    },
  ],
});
