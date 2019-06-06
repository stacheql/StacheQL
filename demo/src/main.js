import Vue from "vue";
import App from "./App";
import router from "./router";
import { ApolloClient } from "apollo-client";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import underscore from "vue-underscore";
import VueApollo from "vue-apollo";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

// this disables Apollo's cache-- fetchPolicy of 'network-only'
const defaultOptions = {
  watchQuery: {
    fetchPolicy: "network-only",
    errorPolicy: "ignore",
  },
  query: {
    fetchPolicy: "network-only",
    errorPolicy: "all",
  },
};

Vue.config.productionTip = false;

Vue.use(BootstrapVue);

Vue.use(underscore);

const httpLink = new HttpLink({
  uri: "http://localhost:3020/api",
});

const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  connectToDevTools: true,
  defaultOptions,
});

Vue.use(VueApollo);

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
});

new Vue({
  el: "#app",
  router,
  apolloProvider,
  template: "<App/>",
  components: {
    App,
  },
});
