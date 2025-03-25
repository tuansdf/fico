#!/usr/bin/env node

import arg from "arg";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createGzip } from "node:zlib";

const HELP =
  "Example: fico --input dist --ext html --ext js --ext css --override true";

const args = arg(
  {
    "--override": Boolean,
    "--ext": [String],
    "--input": String,
    "-i": "--input",
    "-e": "--ext",
  },
  { permissive: true },
);
if (!args["--ext"]?.length) {
  console.error(
    "Please provide a list of extensions that should be compressed.",
  );
  console.info(HELP);
  process.exit(1);
}
if (!args["--input"]) {
  args["--input"] = ".";
}

const compressFile = async (filePath) => {
  const isFile = (await fsp.lstat(filePath)).isFile();
  if (!isFile) return;
  const outputPath = filePath + ".gz";
  if (!args["--override"] && (await fsp.exists(outputPath))) return;
  const gzip = createGzip({ level: 6 });
  const source = fs.createReadStream(filePath);
  const destination = fs.createWriteStream(outputPath);
  source
    .pipe(gzip)
    .pipe(destination)
    .on("finish", () => {
      console.log(`File ${filePath} compressed successfully!`);
    });
};

const processPath = async (filePath) => {
  const files = await fsp.readdir(filePath);
  for (const file of files) {
    const currentPath = path.join(filePath, file);
    const isFile = (await fsp.lstat(currentPath)).isFile();
    if (!isFile) {
      await processPath(currentPath);
      continue;
    }
    const extension = currentPath.substring(currentPath.lastIndexOf(".") + 1);
    if (args["--ext"].includes(extension)) {
      compressFile(currentPath);
    }
  }
};

const main = async () => {
  await processPath(path.resolve(process.cwd(), args["--input"]));
};

main();
