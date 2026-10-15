import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // The Express API from ../server. Keeps CouchDB credentials out of the browser.
    proxy: { "/api": "http://localhost:3001" },
  },
  test: {
    environment: "jsdom",
  },
});
