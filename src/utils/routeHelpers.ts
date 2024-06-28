import { useRoute } from "vue-router";
import router from "@/router";

export function getRouteQuery(key: string): string | null {
  const route = useRoute();

  if (key in route.query) {
    return String(route.query[key]);
  } else {
    return null;
  }
}

export function setRouteQuery(key: string, value: any) {
  router.push({ query: { ...router.currentRoute.value.query, [key]: value } });
}

export function getRouterParam(key: string) {
  const route = useRoute();
  if (route.params[key]) return route.params[key];
  return null;
}

export function setRoute(path: string) {
  router.push(path);
}
