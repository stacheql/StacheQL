<template>
  <div class="search-bar">
    <form v-on:submit.prevent="searchYelp">
      <input placeholder="search" type="search" name="search-text" v-model="term">
      <input id="limitBox" placeholder="limit" type="search" name="limit-text" v-model="limit">
      <span class="searchBartext">within</span>
      <!-- <input
        type="text"
        name="distance"
        pattern="[0-9]"
        title="number in miles"
        v-model="radius"
      >-->
      <select name="distance" v-model="radius">
        <option
          v-for="distance in distanceOptions"
          :value="distance"
        >{{distance}} mile{{distance > 1 ? 's' : ''}}</option>
      </select>
      <span class="searchBartext">of</span>
      <input
        id="zipBox"
        type="text"
        name="zipcode"
        placeholder="enter zip"
        pattern="[0-9]{5}"
        title="5 digit zip code"
        v-model="zipcode"
      >
      <button v-on:click="searchYelp">Search</button>
    </form>
    <hr>
  </div>
</template>

<script>
export default {
  name: "SearchBar",
  data() {
    return {
      placeholder: "Find",
      term: "",
      zipcode: "",
      radius: 0,
      limit: "",
      distanceOptions: [1, 2, 3, 5, 10]
    };
  },
  methods: {
    searchYelp() {
      this.$router.push({
        path: "search",
        query: {
          term: this.term,
          radius: this.radius,
          location: this.zipcode,
          limit: this.limit
        }
      });
    }
  }
};
</script>

<style scoped>
</style>