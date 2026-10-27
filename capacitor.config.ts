import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The iOS and Android apps bundle the static export in out/. After a change, run
 * `pnpm cap:sync` to rebuild it and copy it into ios/ and android/.
 */
const config: CapacitorConfig = {
  appId: "de.khmkkoeln.app",
  appName: "KHMK Köln",
  webDir: "out",
};

export default config;
