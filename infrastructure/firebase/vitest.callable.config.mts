import { fileURLToPath } from "node:url";

export default {
  root: fileURLToPath(new URL("../../", import.meta.url)),
  test: {
    include: ["infrastructure/firebase/**/*.callable.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
};
