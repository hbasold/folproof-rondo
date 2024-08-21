# Proof Rondo
A First-Order Logic (FOL) proof verifier written in JavaScript.

## Demo
While there are multiple ways to use Proof Rondo, a frontend has been built
(see the `frontend/` directory) to conveniently interact with its parser and verifier through the web.
Take it for a test
drive
at: [https://liacs.leidenuniv.nl/~basoldh/education/proof-rondo/](https://liacs.leidenuniv.nl/~basoldh/education/proof-rondo/).

## Building and Installing
1. If you don't have Node.js and npm installed, please install both.
   - _See [https://docs.npmjs.com/downloading-and-installing-node-js-and-npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
   for more information._
2. Open a terminal and navigate to the Proof Rondo directory (the one containing the
   `package.json` file).
3. Run `npm install` to install the libraries Proof Rondo needs. If you would
   like to run Proof Rondo in a terminal from anywhere on your computer, 
   additionally provide the `-g` option, so: `npm install -g`.
4. _(Optional) look at the `package.json` for the scripts used for
   bundling the frontend code and generating the parser file._

## Running
There are several ways to run Proof Rondo:

1. **From the terminal**:
    - **After installation**: type `folproof [your-proof].fol`, from anywhere.
    - **Without installation**: type `npx folproof [your-proof].fol`, from within the
      Proof Rondo directory (where you performed `npm install`).

_For help with using Logic Rondo from the terminal, provide the `--help` flag._

2. **From the web**:
    - **Use**: open the `frontend/index.html` file using a local web server, or
      use the aforementioned demo website.
    - **Create yourself**: Take a look at the `frontend/` directory to get an idea
      of how to get started using Proof Rondo on your website.

## Architecture Overview
| File/Directory       | Description                                                                                   |
|----------------------|-----------------------------------------------------------------------------------------------|
| `docs/`              | Describes the language accepted by Proof Rondo.                                               |
| `frontend/`          | Code specific to the frontend we built for Proof Rondo.                                       |
| `frontend/bundle.js` | Is created using ESBuild (see the `package.json`).                                            |
| `src/`               | Source code for the parser and verifier.                                                      |
| `test/`              | Mocha unit tests.                                                                             |
| `folproof-cli.mjs`   | Source code for using Proof Rondo as CLI tool.                                                |
| `folproof-parser.js` | Built automatically from `./src/parser/folproof-parser.jison` and `folproof-parser.jisonlex`. |
| `folproof-web.mjs`   | Renders proof ASTs to HTML. It is not frontend specific.                                      |
