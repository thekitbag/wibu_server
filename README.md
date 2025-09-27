# WIBU Server

This is the backend for the "What I Bought You" application. It is built with Node.js, Express, and Prisma.

## Prerequisites

- Node.js (v20.x or later)
- npm

## Getting Started

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Initialize the Database:**

    This project uses Prisma with a SQLite database. To create the database file and run the initial schema migration, run:

    ```bash
    npx prisma migrate dev
    ```

3.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    The server will start on `http://localhost:8080`.

## Testing

To run the automated tests, use:

```bash
npm test
```
