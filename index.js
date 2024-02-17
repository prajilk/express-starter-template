#!/usr/bin/env node

import prompts from "prompts"
import fs from "node:fs"
import path from "node:path"
import minimist from "minimist"
import {
    blue,
    green,
    red,
    reset,
    yellow,
} from "kolorist"
import createTemplate from "./createTemplate.js";

const argv = minimist(process.argv.slice(2), { string: ["_"] });
let result = {}

const DATABASES = [
    {
        name: "mongodb",
        display: "Mongodb/Mongoose",
        color: green
    },
    {
        name: "postgresql",
        display: "Postgresql",
        color: blue
    },
]

const LANGUAGES = [
    {
        name: "ts",
        display: "TypeScript",
        color: blue
    },
    {
        name: "js",
        display: "JavaScript",
        color: yellow
    },
]

const defaultTargetDir = "server";
const argTargetDir = formatTargetDir(argv._[0])

let argDatabase = argv.database || argv.db
let argDbName = argv.dbname || argv.dbn
let language = argv.ts ? "ts" : argv.js ? "js" : null

if (argv.help || argv.h) {
    console.log(`\nUsage: npx create-my-express-server [project-name] [options]

Options:
  --ts          To Select TypeScript as language
  --js          To Select JavaScript as language
  --db          Specify the database to use (e.g., mongodb, postgresql)
  --dbname      Specify the name of the database
  -h, --help    Show this help message`);
    process.exit(0);
}
if (!isValidDBName(argDbName)) argDbName = null;

if (!DATABASES.some(db => db.name === argDatabase)) {
    argDatabase = null;
}

let targetDir = argTargetDir || defaultTargetDir
const getProjectName = () => targetDir === "." ? path.basename(path.resolve()) : targetDir

try {
    result = await prompts(
        [
            {
                type: argTargetDir ? null : "text",
                name: "projectName",
                message: reset("Project name:"),
                initial: defaultTargetDir,
                onState: state => {
                    targetDir = formatTargetDir(state.value) || defaultTargetDir
                }
            },
            {
                type: () =>
                    !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm",
                name: "overwrite",
                message: () =>
                    (targetDir === "."
                        ? "Current directory"
                        : `Target directory "${targetDir}"`) +
                    ` is not empty. Remove existing files and continue?`
            },
            {
                type: (_, { overwrite }) => {
                    if (overwrite === false) {
                        console.error(red("✖") + " Operation cancelled");
                        process.exit(0);
                    }
                    return null
                },
                name: "overwriteChecker"
            },
            {
                type: () => (isValidPackageName(getProjectName()) ? null : "text"),
                name: "packageName",
                message: reset("Package name:"),
                initial: () => toValidPackageName(getProjectName()),
                validate: dir => isValidPackageName(dir) || "Invalid package.json name"
            },
            {
                type:
                    language ? null : "select",
                name: "languageChoice",
                message:
                    typeof language === "string"
                        ? reset(
                            `"${language}" isn't a valid language. Please choose from below: `
                        )
                        : reset("Select a Language:"),
                initial: 0,
                choices: LANGUAGES.map(language => {
                    const languageColor = language.color
                    return {
                        title: languageColor(language.display || language.name),
                        value: language.name
                    }
                })
            },
            {
                type:
                    argDatabase ? null : "select",
                name: "databaseChoice",
                message:
                    typeof argDatabase === "string"
                        ? reset(
                            `"${argDatabase}" isn't a valid database. Please choose from below: `
                        )
                        : reset("Select a database:"),
                initial: 0,
                choices: DATABASES.map(database => {
                    const databaseColor = database.color
                    return {
                        title: databaseColor(database.display || database.name),
                        value: database.name
                    }
                })
            },
            {
                type: (prev) => prev === 'mongodb' ? 'text' : null,
                name: "databaseName",
                message: reset("Database name:"),
                validate: dbName => isValidDBName(dbName) || "Invalid database name (Don't contain white-spaces & max-length is 20)"
            },
        ],
        {
            onCancel: () => {
                console.error(red("✖") + " Operation cancelled");
                process.exit(0);
            }
        }
    )
} catch (cancelled) {
    console.log(cancelled.message)
}

function formatTargetDir(targetDir) {
    return targetDir?.trim().replace(/\/+$/g, "")
}

function isEmpty(path) {
    const files = fs.readdirSync(path)
    return files.length === 0 || (files.length === 1 && files[0] === ".git")
}

function isValidPackageName(projectName) {
    return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}

function isValidDBName(dbName) {
    return /^[^\s]{1,20}$/.test(dbName);
}

function toValidPackageName(projectName) {
    return projectName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/^[._]/, "")
        .replace(/[^a-z\d\-~]+/g, "-")
}


if (argTargetDir) result.projectName = argTargetDir;
if (argDatabase) result.databaseChoice = argDatabase;
if (!result.databaseName) result.databaseName = argDbName;
if (!result.packageName) result.packageName = path.basename(path.resolve());

createTemplate(result);