#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import maps from "./maps/index.js";

yargs(hideBin(process.argv)).command(maps).help().argv;
