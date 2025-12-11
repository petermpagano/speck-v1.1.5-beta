import fs from "fs";
import path from "path";

export default function speckJsxLoader() {
  return {
    name: "vite-speck-jsx-loader",
    enforce: "pre",

    resolveId(source, importer) {
      if (source.includes(".compiled") && source.endsWith(".js")) {
        return path.resolve(
          importer ? path.dirname(importer) : process.cwd(),
          source
        );
      }
      return null;
    },

    load(id) {
      if (id.includes(path.normalize("/.compiled/")) && id.endsWith(".js")) {
        const code = fs.readFileSync(id, "utf-8");
        return {
          code,
          loader: "jsx",
        };
      }
    },

    handleHotUpdate({ file, server }) {
      if (file.endsWith(".speck")) {
        console.log(
          "[Speck] 🔄 .speck file changed, triggering full reload:",
          file
        );
        server.ws.send({
          type: "full-reload",
          path: "*",
        });
      }
    },
  };
}
