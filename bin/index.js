#!/usr/bin/env node
import axios from "axios";
import * as cheerio from "cheerio";
import { program } from "commander";
import chalk from "chalk";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

program
  .description("A sample application to parse options")
  .option("-b, --beta <VALUE>", "Specify a VALUE", "Foo")
  .option("-a, --add <VALUE>", "Specify a VALUE", "Foo");

program.parse();

const options = program.opts();
const beta = !options.beta ? "no" : options.beta;
const add = !options.add ? "no" : options.add;

async function getHTML(url) {
  const { data: html } = await axios.get(url);
  return html;
}

// them flag cho cambridge va american dictionary

(async function() {
  const res = await getHTML(
    `https://dictionary.cambridge.org/dictionary/english/${beta}`
  );
  const $ = cheerio.load(res);
  const test = $(".sense-body.dsense_b").first(); // selector cambridge dict

  const vocab = test.find(".sense-body.dsense_b > .def-block.ddef_block");

  const id = uuidv4();
  const def = vocab
    .eq(+add - 1)
    .find(".def.ddef_d.db")
    .text();
  const ex = vocab
    .eq(+add - 1)
    .find("span.eg.deg")
    .first()
    .text();
  const data = `${id}\t${beta}\t${def}\t${ex}\n`;
  if (!(add === "Foo")) {
    fs.writeFile("./log.txt", data, { flag: "a" }, function(err) {
      if (err) {
        return console.error(err);
      }
    });
    console.log("DONE!");
  }

  if (add === "Foo") {
    vocab.each((i, e) => {
      const def = chalk.blue(i + 1 + ". " + $(e).find(".def.ddef_d.db").text());
      console.log(def);
      $(e)
        .find("span.eg.deg")
        .each((i, e) => {
          if (i <= 2) console.log("- " + chalk.yellow($(e).text()));
        });
    });
  }
})();
