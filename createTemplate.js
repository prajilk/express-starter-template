import * as fs from "fs";
import path from 'path';
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const indexCodeFile = 'indexContent.txt';
const dbConfigFile = 'dbConfig.txt';
const packageFile = 'packageContent.json';
const userModelFile = 'userModel.txt';
const userControllerFile = 'controllerContent.txt';
const userRouterFile = 'routeSContent.txt';

// Read file content from template file.
const readTemplateFile = (fileName) => {
    return fs.readFileSync(path.join(__dirname, 'template-codes', fileName), 'utf-8');
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
    const envContent = 'MONGODB_URI = mongodb://localhost:27017/';

    try {

        const foldersToCreate = [
            [destination, 'config'],
            [destination, 'api', 'routes'],
        ];

        if (answers['databaseChoice'] === 'mongodb') {
            foldersToCreate.push(
                [destination, 'api', 'models'],
                [destination, 'api', 'controllers']
            );
        }

        foldersToCreate.forEach(folder => createFolder(...folder));


        const fileData = [
            { path: destination, folders: [], name: 'index.js', content: readTemplateFile(indexCodeFile) },
            { path: destination, folders: [], name: '.gitignore', content: gitContent },
            { path: destination, folders: [], name: 'package.json', content: packageContent },
        ];

        if (answers['databaseChoice'] === 'mongodb') {
            fileData.push(
                { path: destination, folders: [], name: '.env', content: envContent + answers['databaseName'] },
                { path: destination, folders: ['config'], name: 'dbConfig.js', content: readTemplateFile(dbConfigFile) },
                { path: destination, folders: ['api', 'models'], name: 'User.js', content: readTemplateFile(userModelFile) },
                { path: destination, folders: ['api', 'controllers'], name: 'UserController.js', content: readTemplateFile(userControllerFile) },
                { path: destination, folders: ['api', 'routes'], name: 'UserRoutes.js', content: readTemplateFile(userRouterFile) }
            );
        }

        fileData.forEach(file => createFile(file.path, file.folders, file.name, file.content));

        // INSTALL DEPENDENCIES

        function installDependencies(command) {

            try {
                execSync(command, { stdio: 'inherit' });
            } catch (error) {
                console.error('An error occurred:', error);
            }
        }

        console.log("\n     Installing packages... (express, cors, cookie-parser, dotenv, mongoose, nodemon)\n");

        if (answers.projectName !== '.') {
            installDependencies(`cd ${answers.projectName} && npm i express cors cookie-parser dotenv mongoose`);
            installDependencies(`cd ${answers.projectName} && npm i -D nodemon`)
            installDependencies(`cd ${answers.projectName} && git init`)
        } else {
            installDependencies('npm i express cors cookie-parser dotenv mongoose');
            installDependencies('npm i -D nodemon')
            installDependencies('git init')
        }
        console.log("\n     Express server created successfully.");

    } catch (error) {
        console.error(error);
    }
}

export default createTemplate;