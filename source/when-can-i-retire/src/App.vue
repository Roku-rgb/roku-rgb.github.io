<script setup lang="ts">
import { ref } from "vue";
import NavBar from "./components/NavBar.vue";
import RetirementCalculator from "./pages/RetirementCalculator.vue";
import IntroPage from "./pages/IntroPage.vue";

const activePage = ref("calculator");

function onNavigate(page: string) {
  activePage.value = page;
  window.gtag?.("event", "tab_switch", { tab_name: page });
}
</script>

<template>
  <NavBar :active="activePage" @navigate="onNavigate" />
  <RetirementCalculator v-if="activePage === 'calculator'" />
  <IntroPage v-else-if="activePage === 'intro'" />
</template>
