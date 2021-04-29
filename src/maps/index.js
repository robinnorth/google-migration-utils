import importPlaces from "./importPlaces.js";

export default {
  command: "maps <command>",
  builder: (yargs) => {
    return yargs.command(importPlaces);
  },
  describe: "Google Maps commands",
  handler: () => {},
};
