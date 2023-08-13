#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from "fs";
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.resolve();

const CHOICES = ['mongodb/mongoose'];

const QUESTIONS = [
    {
        name: 'project-name',
        type: 'input',
        message: 'Project name:',
        validate: function (input) {
            if (/^[a-z\-]+$/.test(input)) return true;
            else return 'Project name may only include lowercase letters and hyphens.';
        }
    },
    {
        name: 'database-choice',
        type: 'list',
        message: 'Which database would you like to use?',
        choices: CHOICES
    },
    {
        name: 'database-name',
        type: 'input',
        message: 'Database name:',
        validate: function (input) {
            if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
            else return 'Database name may only include letters, hyphens and underscores.';
        }
    }
];


inquirer.prompt(QUESTIONS).then(answers => {

    const destination = process.cwd();
    const srcPath = path.join(destination, 'src');

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

    // Convert JS Object to json
    const packageJson = readTemplateFile(packageFile);
    const packageObj = JSON.parse(packageJson);
    packageObj.name = answers['project-name'];
    const packageContent = JSON.stringify(packageObj, null, 4);

    const gitContent = '.env \n*.env \n/node_modules \npackage-lock.json';
    const envContent = 'MONGODB_URI = mongodb://localhost:27017/';

    try {

        const foldersToCreate = [
            [destination, 'src'],
            [srcPath, 'config'],
            [srcPath, 'api', 'routes'],
        ];

        if (answers['database-choice'] === 'mongodb/mongoose') {
            foldersToCreate.push(
                [srcPath, 'api', 'models'],
                [srcPath, 'api', 'controllers']
            );
        }

        foldersToCreate.forEach(folder => createFolder(...folder));


        const fileData = [
            { path: srcPath, folders: [], name: 'index2.js', content: readTemplateFile(indexCodeFile) },
            { path: destination, folders: [], name: '.gitignore2', content: gitContent },
            { path: destination, folders: [], name: 'package2.json', content: packageContent },
        ];

        if (answers['database-choice'] === 'mongodb/mongoose') {
            fileData.push(
                { path: destination, folders: [], name: '.env', content: envContent + answers['database-name'] },
                { path: srcPath, folders: ['config'], name: 'dbConfig.js', content: readTemplateFile(dbConfigFile) },
                { path: srcPath, folders: ['api', 'models'], name: 'User.js', content: readTemplateFile(userModelFile) },
                { path: srcPath, folders: ['api', 'controllers'], name: 'UserController.js', content: readTemplateFile(userControllerFile) },
                { path: srcPath, folders: ['api', 'routes'], name: 'UserRoutes.js', content: readTemplateFile(userRouterFile) }
            );
        }

        fileData.forEach(file => createFile(file.path, file.folders, file.name, file.content));

        // INSTALL DEPENDENCIES

        function showLoadingSpinner() {
            const spinnerFrames = ['-', '\\', '|', '/'];
            let frame = 0;

            return setInterval(() => {
                process.stdout.write(`\r${spinnerFrames[frame]} Installing packages...`);
                frame = (frame + 1) % spinnerFrames.length;
            }, 100);
        }

        function stopLoadingSpinner(intervalId) {
            clearInterval(intervalId);
            process.stdout.write('\r'); // Clear the loading spinner line
        }

        function installDependencies(command) {
            const loadingInterval = showLoadingSpinner();

            try {
                execSync(command, { stdio: 'inherit' });
            } catch (error) {
                console.error('An error occurred:', error);
            } finally {
                stopLoadingSpinner(loadingInterval);
            }
        }

        installDependencies('npm i express cors cookie-parser dotenv mongoose');
        installDependencies('npm i -D nodemon')
        console.log("\n     Express server created successfully.");

    } catch (error) {
        console.error(error);
    }
});