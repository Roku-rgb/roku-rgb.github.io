<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import NavBar from "./components/common/NavBar.vue";
import RetirementCalculator from "./pages/RetirementCalculator.vue";
import PortfolioSimulator from "./pages/PortfolioSimulator.vue";
import IntroPage from "./pages/IntroPage.vue";

const validPages = ["calculator", "portfolio", "intro"];

function getPageFromHash(): string {
  const raw = window.location.hash.replace("#", "");
  const page = raw.split("/")[0];
  return validPages.includes(page) ? page : "calculator";
}

const activePage = ref(getPageFromHash());

function onNavigate(page: string) {
  activePage.value = page;
  window.location.hash = page;
  window.gtag?.("event", "tab_switch", { tab_name: page });
}

function onHashChange() {
  activePage.value = getPageFromHash();
}

onMounted(() => window.addEventListener("hashchange", onHashChange));
onUnmounted(() => window.removeEventListener("hashchange", onHashChange));
</script>

<template>
  <NavBar :active="activePage" @navigate="onNavigate" />
  <RetirementCalculator v-if="activePage === 'calculator'" />
  <PortfolioSimulator v-else-if="activePage === 'portfolio'" />
  <IntroPage v-else-if="activePage === 'intro'" />
</template>
