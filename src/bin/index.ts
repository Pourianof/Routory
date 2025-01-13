#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

function getAbsolutePathFromCWD(filePath: string) {
  if (!path.isAbsolute(filePath)) {
    return path.normalize(path.join(process.cwd(), filePath));
  }
  return filePath;
}

function createRoutoryClass(
  methods: { [key: string]: string },
  className: string,
) {
  const methodTempPath = path.join(__dirname, 'method_template.txt');
  const classTempPath = path.join(__dirname, 'class_template.txt');

  const methodTemplate = fs.readFileSync(methodTempPath, 'utf8');
  const classTemplate = fs.readFileSync(classTempPath, 'utf8');

  const populatedTemplates: string[] = [];

  for (const [methodName, matcherValue] of Object.entries(methods)) {
    const matcher = matcherValue ?? methodName;
    const methodsDeclaration = methodTemplate
      .replace(/\$\$METHOD_NAME\$\$/g, methodName)
      .replace(/\$\$MATCHER_VALUE\$\$/g, `"${matcher}"`)
      .replace(/\$\$CLASS_NAME\$\$/g, className);

    populatedTemplates.push(methodsDeclaration);
  }

  const classString = classTemplate
    .replace(/\$\$CLASS_NAME\$\$/g, className)
    .replace(/\$\$METHODS_PLACEHOLDER\$\$/g, populatedTemplates.join('\n\n'));

  return classString;
}

function getOutputPath(className: string, output?: string): string {
  output = output?.trim();
  if (output) {
    const isTsFile = path.extname(output).endsWith('ts');
    output = getAbsolutePathFromCWD(output);
    if (fs.existsSync(output)) {
      const outStat = fs.statSync(output);
      if (outStat.isDirectory()) {
        return path.join(output, `${className}.ts`);
      } else if (!isTsFile) {
        return `${output}.ts`;
      }
    } else if (!isTsFile) {
      return `${output}.ts`;
    }
  }
  return path.join(process.cwd(), `${className.trim()}.ts`);
}

function writeClassFile(
  classString: string,
  className: string,
  outputPath?: string,
) {
  fs.writeFileSync(getOutputPath(className, outputPath), classString, 'utf8');
}

function jsonConfigs(filePath: string) {
  const { className, methods, outFilePath } = JSON.parse(
    fs.readFileSync(getAbsolutePathFromCWD(filePath), 'utf8'),
  );
  const classString = createRoutoryClass(methods, className);
  writeClassFile(classString, className, outFilePath);
}

function cliConfigs(className: string, methods: string, output?: string) {
  const methodData = methods.split('+').reduce((prev, cur) => {
    const methodInfo = cur.trim().split(':');
    return { ...prev, ...{ [methodInfo[0].trim()]: methodInfo[1].trim() } };
  }, {});
  const classString = createRoutoryClass(methodData, className.trim());
  writeClassFile(classString, className, output);
}

function start() {
  program.option('-j, --json <string>', 'Using json config');
  program.option('-c, --className <string>', 'The Router class name');
  program
    .option(
      '-m, --methods <string>',
      [
        'The well-formatted names and matcher of methods',
        '* Format is like: methName:MATCH-KEY+methName2:MATCH-KEY2+ ... ',
        '* Actually the patterns seperate by plus character',
        '** Matcher refer to the string which used to detect that does the input request message have the same MATCH-KEY in its structure or not',
      ].join('\n'),
    )
    .option(
      '-o, --output <string>',
      'The path which generated class file should located',
    );

  program.parse();

  const options = program.opts();

  console.log(options);

  if (options.json) {
    jsonConfigs(options.json);
  } else {
    if (!(options.className && options.methods)) {
      console.error(
        "🔴If you  don't use json config file then you must provide both -c option for name of class and -m option for the methods which should exist in defined format.\n🔔If you wanna know about format run the --help command",
      );
      return;
    } else {
      cliConfigs(options.className, options.methods, options.output);
    }
  }
}

start();
