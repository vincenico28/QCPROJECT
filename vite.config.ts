import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        // @ts-expect-error - preset is valid in nitro/vinxi but missing in beta types
        preset: process.env.NITRO_PRESET || "node-server",
        entry: "src/server.ts"
      }
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": "/src",
    },
  },
});
