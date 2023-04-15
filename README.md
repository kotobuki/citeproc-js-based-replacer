# `citeproc-js-based-replacer`

## About this tool

`citeproc-js-based-replacer` is a tool for generating [CSL-M](https://citeproc-js.readthedocs.io/en/latest/csl-m/index.html) compatible citations using the [`citeproc-js`](https://github.com/Juris-M/citeproc-js) library. This tool replaces citation keys (`@key`) in Markdown files and adds a bibliography if a header with the text "Bibliography" or "参考文献" is present.

## Features

- Replaces citation keys (`@key`) in Markdown files
- Adds a bibliography if a "Bibliography" or "参考文献" header is present
- Specifies bibliography file, CSL file, and uncited items to include in the bibliography in the YAML header of the Markdown file

## Preparation

### Steps

1. Run `npm install` to install the required libraries
2. Obtain the desired CSL-M file from sources like [jm-styles](https://github.com/Juris-M/jm-styles)
3. Obtain the necessary locale file(s) (e.g., `locales-en-US.xml`) from [citation-style-language / locales](https://github.com/citation-style-language/locales/tree/6b0cb4689127a69852f48608b6d1a879900f418b)
4. Generate a bibliography with [Jurism](https://juris-m.github.io/) or [Zotero](https://www.zotero.org/)

### Example file layout

- `citeproc-js-based-replacer.js`
- `jm-japan-sociological-society.csl`
- `locales-en-US.xml`
- `locales-ja-JP.xml`
- `bibliography.json`
- `input.md`
- `node_modules/`

## Usage

```shell
pandoc input.md -s --filter=./citeproc-js-based-replacer.js -o output.md
```

## Development

This project is in its early stages, and we welcome feedback and bug reports. Pull requests are highly appreciated!

---

## 本ツールについて

`citeproc-js-based-replacer`は、[`citeproc-js`](https://github.com/Juris-M/citeproc-js)ライブラリを使用して[CSL-M](https://citeproc-js.readthedocs.io/en/latest/csl-m/index.html)対応の文献引用を生成するためのツールです。このツールは、Markdownファイル内の引用キー（`@key`）を置き換え、"参考文献"または"Bibliography"というヘッダーがある場合に文献目録を追加します。

## 機能

- Markdownファイル内の引用キー（`@key`）を置き換えます
- "参考文献"または"Bibliography"というヘッダーがある場合に文献目録を追加します
- MarkdownファイルのYAMLヘッダー部分で、bibliographyファイル、CSLファイル、引用しないが参考文献に含めたい文献の指定を行います

## 準備

### 手順

1. `npm install`を実行して必要なライブラリをインストールする
2. [jm-styles](https://github.com/Juris-M/jm-styles) などから、使用したいCSL-Mファイルを入手する
3. [citation-style-language / locales](https://github.com/citation-style-language/locales/tree/6b0cb4689127a69852f48608b6d1a879900f418b) から必要なlocaleファイル（例：`locales-en-US.xml`）を入手する
4. [Jurism](https://juris-m.github.io/)や[Zotero](https://www.zotero.org/)によりJSON形式のbibliographyを生成する

### ファイルの配置例

- `citeproc-js-based-replacer.js`
- `jm-japan-sociological-society.csl`
- `locales-en-US.xml`
- `locales-ja-JP.xml`
- `bibliography.json`
- `input.md`
- `node_modules/`

## 使い方

```shell
pandoc input.md -s --filter=./citeproc-js-based-replacer.js -o output.md
```

## 開発

このプロジェクトはまだ開発が始まったばかりであり、要望や不具合に関するレポートを歓迎します。とくに、プルリクエストは大歓迎です！
