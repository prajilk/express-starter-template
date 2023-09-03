import * as fs from "fs";
import path from 'path';
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const indexCodeFile = 'indexContent.txt';
const dbConfigFile = 'db.txt';
const packageFile = 'packageContent.json';
const userModelFile = 'userModel.txt';
const userControllerFile = 'controllerContent.txt';
const userRouterFile = 'routesContent.txt';

// Read file content from template file.
const readTemplateFile = (filePath) => {
    return fs.readFileSync(path.join(__dirname, 'template-codes', filePath), 'utf-8');
}
// Create files
const createFile = (filepath = '', folders = [], filename = '', content = '') => {
    return fs.writeFileSync(path.join(filepath, ...folders, filename), content)
}
// Create folders
const createFolder = (folderPath, folder1, folder2) => {
    if (!folder2) return fs.mkdirSync(path.join(folderPath, folder1), { recursive: true })
    else fs.mkdirSync(path.join(folderPath, folder1, folder2), { recursive: true })
}

const createTemplate = (answers) => {

    let destination = process.cwd();
    const databaseChoice = answers['databaseChoice'];

    if (answers.projectName !== '.') {
        fs.mkdirSync(path.join(destination, answers.projectName), { recursive: true })
        destination = path.join(destination, answers.projectName);
    }

    // Convert JS Object to json
    const packageJson = readTemplateFile(packageFile);
    const packageObj = JSON.parse(packageJson);
    packageObj.name = answers['packageName'];
    const packageContent = JSON.stringify(packageObj, null, 4);

    const gitContent = '.env \n*.env \n/node_modules \npackage-lock.json';
    let envContent = null;
    if (databaseChoice === 'mongodb') {
        envContent = 'MONGODB_URI = mongodb://127.0.0.1:27017/';
    } else if (databaseChoice === 'postgresql') {
        envContent = 'PGUSER = \nPGPASSWORD = \nPGDATABSE = \n';
    }

    try {

        const foldersToCreate = [
            [destination, 'src', 'config'],
            [destination, 'src', 'routes'],
        ];

        if (databaseChoice === 'mongodb') {
            foldersToCreate.push(
                [destination, 'src', 'models'],
                [destination, 'src', 'controllers']
            );
        } else if (databaseChoice === 'postgresql') {
            foldersToCreate.push(
                [destination, 'src', 'controllers']
            );
        }

        foldersToCreate.forEach(folder => createFolder(...folder));


        const fileData = [
            { path: destination, folders: [], name: 'index.js', content: readTemplateFile(path.join(databaseChoice, indexCodeFile)) },
            { path: destination, folders: [], name: '.gitignore', content: gitContent },
            { path: destination, folders: [], name: 'package.json', content: packageContent },
        ];

        if (databaseChoice === 'mongodb') {
            fileData.push(
                { path: destination, folders: [], name: '.env', content: envContent + answers['databaseName'] },
                { path: destination, folders: ['src', 'models'], name: 'User.js', content: readTemplateFile(path.join(databaseChoice, userModelFile)) },
            );
        } else if (databaseChoice === 'postgresql') {
            fileData.push(
                { path: destination, folders: [], name: '.env', content: envContent }
            );
        }
        fileData.push(
            { path: destination, folders: ['src', 'config'], name: 'db.js', content: readTemplateFile(path.join(databaseChoice, dbConfigFile)) },
            { path: destination, folders: ['src', 'controllers'], name: 'UserController.js', content: readTemplateFile(path.join(databaseChoice, userControllerFile)) },
            { path: destination, folders: ['src', 'routes'], name: 'UserRoutes.js', content: readTemplateFile(path.join('mongodb', userRouterFile)) }
        );

        fileData.forEach(file => createFile(file.path, file.folders, file.name, file.content));

        // INSTALL DEPENDENCIES

        function installDependencies(command) {

            try {
                execSync(command, { stdio: 'inherit' });
            } catch (error) {
                console.error('An error occurred:', error);
            }
        }

        if (databaseChoice === 'mongodb') {
            console.log("\n     Installing packages... (express, cors, cookie-parser, dotenv, mongoose, nodemon)\n");
        } else if (databaseChoice === 'postgresql') {
            console.log("\n     Installing packages... (express, cors, cookie-parser, dotenv, pg, nodemon)\n");
        }

        if (answers.projectName !== '.') {
            if (databaseChoice === 'mongodb') {
                installDependencies(`cd ${answers.projectName} && npm i express cors cookie-parser dotenv mongoose`);
            } else if (databaseChoice === 'postgresql') {
                installDependencies(`cd ${answers.projectName} && npm i express cors cookie-parser dotenv pg`);
            }
            installDependencies(`cd ${answers.projectName} && npm i -D nodemon`)
            installDependencies(`cd ${answers.projectName} && git init`)
        } else {
            if (databaseChoice === 'mongodb') {
                installDependencies('npm i express cors cookie-parser dotenv mongoose');
            } else if (databaseChoice === 'postgresql') {
                installDependencies('npm i express cors cookie-parser dotenv pg');
            }
            installDependencies('npm i -D nodemon')
            installDependencies('git init')
        }

        console.log(`\n     Express server created successfully with ${databaseChoice}.`);

    } catch (error) {
        console.error(error);
    }
}

export default createTemplate;