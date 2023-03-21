import csv from "csvtojson";
import delay from "delay";
import { readFileSync } from "fs";
import inquirer from "inquirer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// (Attempt to) Prevent Google Account login from being blocked for using an automated browser
puppeteer.use(StealthPlugin());

const LIST_INDEXES = Object.freeze({
  Favorites: 0,
  WantToGo: 1,
  Starred: 3,
  Custom: 256,
});
const LIST_NAMES = Object.freeze({
  [LIST_INDEXES.Favorites]: "Favorites",
  [LIST_INDEXES.WantToGo]: "Want To Go",
  [LIST_INDEXES.Starred]: "Starred Places",
  [LIST_INDEXES.Custom]: "Custom",
});
const LOGIN_URL = "https://accounts.google.com/";

const importPlaces = async (argv) => {
  const options = await inquirer.prompt(
    [
      {
        message:
          "Provide the path to a file containing Google Maps places data in GeoJSON or a Google Maps places list in CSV format",
        type: "input",
        name: "file",
      },
      {
        message: "Which list should these places be imported to?",
        type: "list",
        name: "list",
        choices: Object.values(LIST_INDEXES).map((item) => ({
          name: LIST_NAMES[item],
          value: item,
        })),
        default: 2,
      },
      {
        message: "Enter the index of the custom list you want to import to",
        type: "number",
        name: "customList",
        when: (answers) => answers.list === LIST_INDEXES.Custom,
      },
    ],
    {
      file: argv.file,
      list: argv.list,
      customList: argv.customList,
    }
  );

  let { file, list, customList } = options;

  // Prepare places data
  const places = [];

  if (file.match(/json$/i)) {
    const jsonFile = readFileSync(file);
    const data = JSON.parse(jsonFile);

    for (let item of data.features) {
      let { ["Google Maps URL"]: url, Title: name } = item.properties;
      places.push({ name, url });
    }
  } else {
    const data = await csv().fromFile(file);

    for (let item of data) {
      let { Title: name, URL: url } = item;
      places.push({ name, url });
    }
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Ensure long imports don't time out
  page.setDefaultTimeout(0);

  await page.exposeFunction("log", (...args) => console.log(...args));
  await page.exposeFunction("delay", delay);

  const exit = () => {
    browser.close();
  };

  // Google Account login
  await page.goto(LOGIN_URL);
  await page.setBypassCSP(true);

  let { confirmlogin } = await inquirer.prompt([
    {
      type: "confirm",
      message: "You can log in or abort now. Confirm when logged in.",
      name: "confirmlogin",
    },
  ]);
  if (confirmlogin == false) {
    exit();
    return;
  }

  console.log(`${places.length} places found to import in ${file}`);
  console.log(`Importing Google Maps places to '${LIST_NAMES[list]}' list`);

  for (let place of places) {
    let { name, url } = place;

    await page.goto(url, { waitUntil: "load" });

    // Load Google Maps page for place
    await page.evaluate(
      async (name, listIndex, listName) => {
        await window.delay(150);
        let saveButton = document.querySelector(
          "button[jsaction='pane.placeActions.save;keydown:pane.placeActions.save']"
        );
        let message = "";

        if (saveButton) {
          // Save
          saveButton.click();

          // Select list to save to, after waiting for the selector menu to display
          await window.delay(150);

          let listCheckbox = document.querySelector(
            `[data-index="${listIndex}"][aria-checked="false"]`
          );

          if (listCheckbox) {
            if (listCheckbox.ariaChecked === "false") {
              listCheckbox.click();

              message = `✔ Saved "${name}"`;
            } else {
              message = `➡ Skipping "${name}" as it was already saved to this list`;
            }
          } else {
            message = `❌ Could not find '${listName}' list for "${name}"`;
          }
        } else {
          message = `❌ Could not find 'Save' button for "${name}"`;
        }

        await window.log(message);

        return;
      },
      name,
      customList || (typeof list === "string" ? LIST_INDEXES[list] : list),
      LIST_NAMES[list]
    );
  }

  exit();

  console.log("Finished importing places!");
};

export default {
  command: "import-places",
  builder: {
    file: {
      alias: "f",
      describe:
        "Path to a file containing Google Maps places data in GeoJSON or a Google Maps places list in CSV format",
      type: "string",
    },
    list: {
      alias: "l",
      describe: "Name of the list you want to import to",
      type: "string",
      choices: ["Favorites", "WantToGo", "Starred", "Custom"],
    },
    customList: {
      alias: "c",
      describe: "Index of the custom list you want to import to",
      type: "number",
    },
  },
  describe:
    "Imports places to Google Maps from saved places GeoJSON or CSV data files that were exported by Google Takeout",
  handler: importPlaces,
};
