<template>
  <div class="search-page">
    <search-bar></search-bar>
    <h1>Load time: <b>{{search.total}} millisecond{{search.total === 1 ? '' : 's'}}</b></h1>
    <div class="loading" v-if="isLoading">
      <img src="../assets/timer2.gif"> Loading...
    </div>
    <ul v-if="search.business">
      <li v-for="business in search.business">
        <br><span class="bizName">{{business.name}}</span> <span class="star">  {{business.rating}} ★</span></br>
        <br>{{business.location.formatted_address}}</br>
        <br><span class="reviewText">{{business.reviews[0].user.name}} says: <i>"{{business.reviews[0].text}}"</i>  </span></br>
        <br><span class="reviewText">{{business.reviews[1].user.name}} says: <i>"{{business.reviews[1].text}}"</i>  </span></br>
        <br></br>
      </li>
    </ul>
  </div>
</template>

<script>
import SearchBar from "./SearchBar.vue";
import gql from "graphql-tag";
import { _ } from "vue-underscore";
import Router from "vue-router";

export default {
  name: "SearchPage",
  components: {
    SearchBar
  },
  apollo: {
    $loadingKey: "isLoading",
    search: {
      query() {
        if (this.term && this.location && this.radius && this.limit) {
          let date = new Date();
          console.log('** query() **', date.toLocaleTimeString())
          return gql`
            query searchYelp(
              $term: String!
              $location: String!
              $radius: Float!
              $limit: Int!
              $offset: Int!
            ) {
              search(
                term: $term
                location: $location
                radius: $radius
                limit: $limit
                sort_by: "rating"
                offset: $offset
              ) {
                total
                business {
                  name
                  rating
                  price
                  photos
                  id
                  location{
                    formatted_address
                    city
                    state
                  }
                  reviews{
                    text
                    user{
                      name
                    }
                    id
                    rating
                    time_created
                    url
                  }
                }
              }
            }
          `;
        }
      },
      variables() {
        return {
          term: this.term,
          location: this.location,
          radius: this.radius * 1609.34,
          limit: +this.limit
        };
      },
    }
  },
  props: ["term", "location", "radius", "limit"],
  data() {
    return {
      search: {},
      isLoading: 0,
    };
  },
};
</script>

<!-- "scoped" attribute limits CSS to this component only -->
<style scoped>
h1{
  color: black
}

h2 {
  font-weight: bold;
}

ul {
  list-style: none;
}
</style>