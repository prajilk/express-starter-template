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
const nodemonFile = 'nodemonContent.json';
const tsConfigFile = 'tsconfigContent.json';
const userModelFile = 'userModel.txt';
const userControllerFile = 'controllerContent.txt';
const userRouterFile = 'routesContent.txt';

// Read file content from template file.
const readTemplateFile = (langTemplate, filePath) => {
    return fs.readFileSync(path.join(__dirname, `${langTemplate}-template-codes`, filePath), 'utf-8');
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

function isTs(lang) {
    return lang === 'ts';
}

const createTemplate = (answers) => {

    let destination = process.cwd();
    const databaseChoice = answers['databaseChoice'];
    const languageChoice = answers['languageChoice'];

    if (answers.projectName !== '.') {
        fs.mkdirSync(path.join(destination, answers.projectName), { recursive: true })
        destination = path.join(destination, answers.projectName);
    }

    // Convert JS Object to json
    const packageJson = readTemplateFile(languageChoice, packageFile);
    const packageObj = JSON.parse(packageJson);
    packageObj.name = answers['packageName'];
    const packageContent = JSON.stringify(packageObj, null, 4);

    const nodemonJson = readTemplateFile('ts', nodemonFile);
    const nodemonObj = JSON.parse(nodemonJson);
    const nodemonContent = JSON.stringify(nodemonObj, null, 4);

    const tsConfigJson = readTemplateFile('ts', tsConfigFile);
    const tsConfigObj = JSON.parse(tsConfigJson);
    const tsConfigContent = JSON.stringify(tsConfigObj, null, 4);

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
            { path: destination, folders: [], name: isTs(languageChoice) ? 'src/index.ts' : 'index.js', content: readTemplateFile(languageChoice, path.join(databaseChoice, indexCodeFile)) },
            { path: destination, folders: [], name: '.gitignore', content: gitContent },
            { path: destination, folders: [], name: 'package.json', content: packageContent },
            { path: destination, folders: [], name: 'nodemon.json', content: nodemonContent },
            { path: destination, folders: [], name: 'tsconfig.json', content: tsConfigContent },
        ];

        if (databaseChoice === 'mongodb') {
            fileData.push(
                { path: destination, folders: [], name: '.env', content: envContent + answers['databaseName'] },
                { path: destination, folders: ['src', 'models'], name: isTs(languageChoice) ? 'User.ts' : 'User.js', content: readTemplateFile(languageChoice, path.join(databaseChoice, userModelFile)) },
            );
        } else if (databaseChoice === 'postgresql') {
            fileData.push(
                { path: destination, folders: [], name: '.env', content: envContent }
            );
        }
        fileData.push(
            { path: destination, folders: ['src', 'config'], name: isTs(languageChoice) ? 'db.ts' : 'db.js', content: readTemplateFile(languageChoice, path.join(databaseChoice, dbConfigFile)) },
            { path: destination, folders: ['src', 'controllers'], name: isTs(languageChoice) ? 'UserController.ts' : 'UserController.js', content: readTemplateFile(languageChoice, path.join(databaseChoice, userControllerFile)) },
            { path: destination, folders: ['src', 'routes'], name: isTs(languageChoice) ? 'UserRoutes.ts' : 'UserRoutes.js', content: readTemplateFile(languageChoice, path.join('mongodb', userRouterFile)) }
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

        function getPackageList(databaseChoice, languageChoice) {
            const commonPackages = ['express', 'cors', 'cookie-parser', 'dotenv', 'nodemon'];
            const mongodbPackages = [...commonPackages, 'mongoose'];
            const postgresqlPackages = [...commonPackages, 'pg'];

            if (databaseChoice === 'mongodb') {
                return languageChoice === 'ts' ? [...mongodbPackages, 'rimraf'] : mongodbPackages;
            } else if (databaseChoice === 'postgresql') {
                return languageChoice === 'ts' ? [...postgresqlPackages, 'rimraf'] : postgresqlPackages;
            } else {
                return commonPackages;
            }
        }

        function logPackageInstallation(packageList) {
            console.log(`\n     Installing packages... (${packageList.join(', ')})\n`);
        }

        const packagesToInstall = getPackageList(databaseChoice, languageChoice);
        logPackageInstallation(packagesToInstall);

        const projectName = answers.projectName;
        const projectPath = projectName !== '.' ? `cd ${projectName} && ` : '';

        if (databaseChoice === 'mongodb') {
            const mongoPackages = languageChoice === 'ts' ?
                'npm i express cors cookie-parser dotenv mongoose rimraf' :
                'npm i express cors cookie-parser dotenv mongoose';
            installDependencies(`${projectPath}${mongoPackages}`);
        } else if (databaseChoice === 'postgresql') {
            const pgPackages = languageChoice === 'ts' ?
                'npm i express cors cookie-parser dotenv pg rimraf' :
                'npm i express cors cookie-parser dotenv pg';
            installDependencies(`${projectPath}${pgPackages}`);
        }

        let tsDevDependencies = 'npm i -D nodemon @types/cookie-parser @types/cors @types/express @types/node ts-node typescript';
        databaseChoice === 'postgresql' && (tsDevDependencies += ' @types/pg');
        const devDependencies = 'npm i -D nodemon';

        const languageSpecificPackages = languageChoice === 'ts' ? tsDevDependencies : devDependencies;
        installDependencies(`${projectPath}${languageSpecificPackages}`);

        installDependencies(`${projectPath}git init`);

        console.log(`\n     Express server created successfully with ${databaseChoice} and ${languageChoice === 'ts' ? 'TypeScript' : 'JavaScript'}.`);

    } catch (error) {
        console.error(error);
    }
}

export default createTemplate;