import { execFileSync } from "node:child_process";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function contentWatchPlugin(): Plugin {
  const contentDir = path.resolve(process.cwd(), "content");
  const scriptPath = path.resolve(process.cwd(), "scripts/generate-content.mjs");

  return {
    name: "fcs-content-watch",
    configureServer(server) {
      server.watcher.add(contentDir);
      server.watcher.on("change", (filePath) => {
        if (filePath.startsWith(contentDir)) {
          execFileSync(process.execPath, [scriptPath], { stdio: "inherit" });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), contentWatchPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
