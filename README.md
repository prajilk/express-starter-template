# Express Starter Template

This template creates necessary files and folder for a basic express server, create database config files and also install necessary npm packages.

## Usage

1. Run the following command,

    ```bash
    npx create-my-express-app
    ```

    Then follow the prompts!

You can also directly specify the project name, database name, and the database you want to use via additional command line options. For example, run:

```bash
# npx create-my-expreaa-app <project-name> --db <database> --dbn <database-name>
npx create-my-express-app new-project --db mongodb --dbn new-database
```

You can use `.` for the project name to scaffold in the current directory.

use `--help` or `-h` to see options.

Currently supported databases:

-   `mongodb`
-   `postgresql`
