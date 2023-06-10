#!/usr/bin/env node
import axios from "axios";
import * as cheerio from "cheerio";
import { program } from "commander";
import chalk from "chalk";
import { v4 as uuidv4 } from "uuid";

const addNote = (noteid, word, def, exam) => {
  return {
    action: "addNote",
    version: 6,
    params: {
      note: {
        deckName: "Default",
        modelName: "Word",
        fields: {
          "Note ID": noteid,
          Word: word,
          Definition: def,
          Example: exam,
        },
        options: {
          allowDuplicate: false,
          duplicateScope: "deck",
          duplicateScopeOptions: {
            deckName: "Default",
            checkChildren: false,
            checkAllModels: false,
          },
        },
      },
    },
  };
};

program
  .description("A sample application to parse options")
  .option("-b, --beta <VALUE>", "Specify a VALUE", "Foo")
  .option("-a, --add <VALUE>", "Specify a definition of word", null);

program.parse();

const options = program.opts();
const beta = !options.beta ? "no" : options.beta;
const add = !options.add ? "no" : options.add;

async function getHTML(url) {
  const { data: html } = await axios.get(url);
  return html;
}

(async function () {
  const res = await getHTML(
    `https://dictionary.cambridge.org/dictionary/english/${beta}`
  );
  const $ = cheerio.load(res);

  const section = $(".sense-body.dsense_b"); // selector cambridge dict
  const vocab = section.find(".sense-body.dsense_b > .def-block.ddef_block");
  const defIndex = +add - 1; // number of definition

  const id = uuidv4();
  const def = vocab.eq(defIndex).find(".def.ddef_d.db").text();
  const ex = vocab.eq(defIndex).find("span.eg.deg").first().text();

  if (options.add) {
    // have -a flag, add note to anki
    axios
      .post("http://127.0.0.1:8765", addNote(id, beta, def, ex))
      .catch((_) => {
        console.log(chalk.red("Please open anki"));
      });
  } else {
    // show definition, not add to anki
    vocab.each((i, e) => {
      const def = chalk.blue(i + 1 + ". " + $(e).find(".def.ddef_d.db").text());
      console.log(def);
      $(e)
        .find("span.eg.deg")
        .each((i, e) => {
          const example = chalk.yellow($(e).text());
          // show 3 example
          if (i <= 3) console.log(`- ${example}`);
        });
    });
  }
})();
