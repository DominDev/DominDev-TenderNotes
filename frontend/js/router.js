export function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [name, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);
  return {
    name: name || "dashboard",
    params,
  };
}

export function navigate(route, params = {}) {
  const query = new URLSearchParams(params).toString();
  window.location.hash = `/${route}${query ? `?${query}` : ""}`;
}

