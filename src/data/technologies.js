// Cores inspiradas nas marcas, ajustadas para ter bom contraste em fundo escuro.
// As chaves ficam em minúsculas para a busca não depender de maiúsculas.
const TECH_COLORS = {
  html: "#f97316",
  css: "#a78bfa",
  javascript: "#facc15",
  react: "#61dafb",
  "react native": "#61dafb",
  node: "#6cc24a",
  "node.js": "#6cc24a",
  mysql: "#38b2d8",
  postgresql: "#7c9fe0",
  php: "#a5b4fc",
  python: "#4f9ae6",
  laravel: "#f87171",
  vue: "#42d392",
  firebase: "#fbbf24",
  arduino: "#00c2c7",
  mqtt: "#c084fc",
  canvas: "#f472b6",
};

const DEFAULT_COLOR = "#9db2c9"; 

export function getTechColor(name) {
  return TECH_COLORS[name.toLowerCase()] ?? DEFAULT_COLOR;
}