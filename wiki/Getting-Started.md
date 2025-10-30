This guide will help you set up your development environment and get your first code changes running.

## Prerequisites

First, make sure you have installed the following:

* [Docker](https://www.docker.com/get-started/)
* [Docker Compose](https://docs.docker.com/compose/install/)
* [Node.js 22/23](https://nodejs.org/en)
* IDE of your choice (e.g. [WebStorm](https://www.jetbrains.com/webstorm/download/) or
  [VS Code](https://code.visualstudio.com/download))

## Next Steps

If all prerequisites are installed, we can start. Since SIEVE consists of an independent frontend and backend,
both need to be started. To do so, read the following instructions.

### Backend

This guide provides instructions on how to set up and run the SIEVE backend on your local machine.
You can either use the provided Docker setup (not yet available) for a quick start
or build the project from source for more control.

Before you begin, ensure you have configured the necessary environment variables.
For a detailed guide on all configuration options, see the
**[Configuration](https://github.com/SE-UUlm/sieve/wiki/Configuration)** page.

#### Building from Source

To build this project from source, run the following commands:

1. Clone the repository:

    ```bash
    git clone git@github.com:SE-UUlm/sieve.git
    cd apps/backend
    ```

2. Install all dependencies using `npm`:

    ```bash
    npm install
    ```

3. Run the backend:

    **Option A** - Development mode (auto-reload on file changes):

    ```bash
    npm run start:dev
    ```

    This runs the NestJS server using `ts-node` and watches for file changes.

    **Option B** - Production mode (compiled output):

    ```bash
    npm run build
    npm run start:prod
    ```

    This first compiles the TypeScript source to JavaScript in the `/dist` directory,
    then starts the server using Node.
