const path = require("path");
const Field = require("./field.js");

let instance = null;

class Config {
  constructor() {
    this.location = Config.determineLocation();
    this.fields = require(`${this.location}`);
  }

  static getInstance() {
    if (instance == null) {
      instance = new Config();
    }
    return instance;
  }

  static determineLocation() {
    if (process.env.NODE_ENV === "production")
      return path.join(__dirname, "../../config/env/production.json");
    return path.join(__dirname, "../../config/env/development.json");
  }

  get(section, option) {
    if (
      this.fields[section] === undefined ||
      this.fields[section][option] === undefined
    ) {
      throw new Error(`Field "${section} => ${option}" does not exist.`);
    }

    const field = new Field(this.fields[section][option]);

    if (field.value === "") {
      const envField =
        process.env[[section.toUpperCase(), option.toUpperCase()].join("_")];
      if (envField !== undefined && envField.length !== 0) {
        return envField;
      }
    }

    if (field.value === undefined) {
      throw new Error(`${section} => ${option} is empty.`);
    }

    return field.value;
  }
}

module.exports = Config;
