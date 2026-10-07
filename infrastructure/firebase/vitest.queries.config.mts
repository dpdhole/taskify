import { fileURLToPath } from "node:url";

export default {
  root: fileURLToPath(new URL("../../", import.meta.url)),
  test: {
    include: ["infrastructure/firebase/**/*.queries.test.ts"],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
};
