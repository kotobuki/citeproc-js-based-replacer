const fs = require("fs");
const path = require("path");
const citeproc = require("citeproc-js-node");

const debugMode = false;

/**
 * Outputs debug log messages when debugMode is true.
 * debugModeがtrueの場合、デバッグログメッセージを出力します。
 *
 * @function debugLog
 * @param {...any} args - Arguments to pass to console.log
 */
function debugLog(...args) {
  if (debugMode) {
    console.log(...args);
  }
}

/**
 * Collects citation keys and citation objects from the input object.
 * 入力オブジェクトから引用キーと引用オブジェクトを収集します。
 *
 * @function collectCitations
 * @param {any} obj - The input object to scan for citations
 * @returns {any} The input object with citations collected
 */
function collectCitations(obj) {
  if (Array.isArray(obj)) {
    return obj.map(collectCitations);
  } else if (typeof obj === "object" && obj !== null) {
    if (obj.t === "Cite") {
      for (const item of obj.c[0]) {
        const citationId = item.citationId;
        const noteIndex = citationKeys.length;
        citationKeys.push(citationId);

        const citationSuffix = item.citationSuffix;

        let locator = "";
        if (citationSuffix.length > 0) {
          const suffixes = citationSuffix
            .filter((suffix) => suffix.t === "Str")
            .map((suffix) => suffix.c.replace(/^\[\s*|\s*\]$/g, ""));
          locator = suffixes.join("|");
        }

        const citationItem = { id: citationId };
        if (locator) {
          citationItem.locator = locator;
        }

        citationObjects.push({
          citationID: `${citationId}_${noteIndex}`,
          citationItems: [citationItem],
          properties: { noteIndex: noteIndex },
        });
      }

      return;
    } else {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          collectCitations(value),
        ])
      );
    }
  } else {
    return;
  }
}

/**
 * Replaces citations in the input object with their formatted text.
 * 入力オブジェクト内の引用を、整形されたテキストに置き換えます。
 *
 * @function replaceCitations
 * @param {any} obj - The input object containing citations to replace
 * @returns {any} The input object with citations replaced
 */
function replaceCitations(obj) {
  if (Array.isArray(obj)) {
    return obj.map(replaceCitations);
  } else if (typeof obj === "object" && obj !== null) {
    if (obj.t === "Cite") {
      const formattedItems = obj.c[0].map(() => {
        const formattedCitation = formattedCitations
          .shift()
          .trim()
          .replace(/<i>/g, "*")
          .replace(/<\/i>/g, "*")
          .replace(/<div class="csl-entry">/g, "")
          .replace(/<\/div>/g, "")
          .replace(/&ndash;/g, "--")
          .replace(/&mdash;/g, "---")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");

        return formattedCitation;
      });

      const concatenatedFormattedItems = formattedItems.join("; ");

      return {
        t: "RawInline",
        c: ["markdown", concatenatedFormattedItems],
      };
    } else {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          replaceCitations(value),
        ])
      );
    }
  } else {
    return obj;
  }
}

/**
 * Converts the bibliography result from citeproc-js to a Pandoc-formatted object.
 * citeproc-jsからの参考文献結果をPandoc形式のオブジェクトに変換します。
 *
 * @function convertBibResultToPandoc
 * @param {Array} bibResult - The bibliography result from citeproc-js
 * @returns {Array} A Pandoc-formatted object representing the bibliography
 */
function convertBibResultToPandoc(bibResult) {
  return bibResult[1].map((bibEntry) => {
    const markdownBibEntry = bibEntry
      .trim()
      .replace(/<i>/g, "*")
      .replace(/<\/i>/g, "*")
      .replace(/<div class="csl-entry">/g, "")
      .replace(/<\/div>/g, "")
      .replace(/&ndash;/g, "--")
      .replace(/&mdash;/g, "---")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

    return {
      t: "Para",
      c: [
        {
          t: "RawInline",
          c: ["markdown", markdownBibEntry],
        },
      ],
    };
  });
}

process.stdin.setEncoding("utf8");

let inputData = "";

process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

const citationKeys = [];
const citationObjects = [];
let citeprocEngine = undefined;

let formattedCitations = undefined;

process.stdin.on("end", () => {
  let dataObj = JSON.parse(inputData);

  const languageCodes = ["en-US", "ja-JP"];
  let locales = {};

  languageCodes.forEach((languageCode) => {
    const localeFilePath = path.join(__dirname, `locales-${languageCode}.xml`);
    try {
      const data = fs.readFileSync(localeFilePath, "utf8");
      locales[languageCode] = data;
    } catch (err) {
      console.error(`Error reading locale file: ${localeFilePath}`, err);
    }
  });

  const cslFile = dataObj.meta.csl.c[0].c;
  debugLog(`cslFile: ${cslFile}`);
  const style = fs.readFileSync(cslFile, "utf-8");

  const bibliographyFile = dataObj.meta.bibliography.c[0].c;
  debugLog(`bibliographyFile: ${bibliographyFile}`);
  const bibliography = JSON.parse(fs.readFileSync(bibliographyFile));

  const sys = {
    retrieveItem: function (itemID) {
      const foundItem = bibliography.find((entry) => entry.id === itemID);

      if (!foundItem) {
        throw new Error(
          `Item with ID "${itemID}" not found in the bibliography.`
        );
      }

      return foundItem;
    },
    retrieveLocale: function (lang) {
      return locales[lang];
    },
  };

  citeprocEngine = new citeproc.CSL.Engine(sys, style);
  citeprocEngine.setOutputFormat("html");

  const citableItemIds = bibliography.map((item) => item.id);
  debugLog(`citableItemIds: ${JSON.stringify(citableItemIds)}`);
  citeprocEngine.updateItems(citableItemIds);

  const uncitedItemIds = dataObj.meta.nocite
    ? dataObj.meta.nocite.c.map((para) => para.c[0].c[0][0].citationId)
    : [];
  debugLog(`uncitedItemIds: ${JSON.stringify(uncitedItemIds)}`);

  if (uncitedItemIds.length > 0) {
    citeprocEngine.updateUncitedItems(uncitedItemIds);
  }

  collectCitations(dataObj.blocks);

  formattedCitations = citationObjects.map((citation, index) => {
    const predecessor = citationObjects
      .slice(0, index)
      .map((prevCitation) => [
        prevCitation.citationID,
        prevCitation.properties.noteIndex,
      ]);
    const successor = [];
    const result = citeprocEngine.processCitationCluster(
      citation,
      predecessor,
      successor
    );
    if (result[0].bibchange === false) {
      return result[1][1] && result[1][1][1]
        ? result[1][1][1]
        : result[1][0][1];
    }

    return result[1][0][1];
  });

  dataObj.blocks = replaceCitations(dataObj.blocks);

  const bibliographyHeaderIndex = dataObj.blocks.findIndex(
    (block) =>
      block.t === "Header" &&
      (block.c[1][0] === "参考文献" || block.c[1][0] === "Bibliography")
  );

  if (bibliographyHeaderIndex >= 0) {
    const bibResult = citeprocEngine.makeBibliography();
    const pandocBibResult = convertBibResultToPandoc(bibResult);
    dataObj.blocks.splice(bibliographyHeaderIndex + 1, 0, ...pandocBibResult);
  }

  process.stdout.write(JSON.stringify(dataObj));
});

process.stdin.resume();
