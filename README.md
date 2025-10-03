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

3.  **Set Up Environment Variables:**

    Create a `.env` file in the root of the `wibu_server` directory. This file is required for Stripe integration and for defining the client URL for local development. Add the following variables:

    ```
    # The URL of the frontend client for CORS and redirects
    CLIENT_URL=http://localhost:5173

    # Your Stripe API keys for testing
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```

4.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    The server will start on `http://localhost:8080`.

## Database Seeding

This project includes a demo journey that showcases the application's features. To populate your database with the demo data, run:

```bash
npm run prisma:seed
```

This script will create a demo journey titled "A Romantic Trip to Paris" with a fixed shareable token (`demo-journey-paris`) that can be used for testing and demonstration purposes. The script is idempotent, meaning it can be run multiple times safely - it will remove any existing demo journey before creating a new one.

### Production Database Seeding

For production environments, use the following command to seed the live database:

```bash
npx ts-node prisma/seed.ts
```

**Note:** Ensure your production environment has the necessary environment variables configured and that you have appropriate database access permissions.

## Testing

To run the automated tests, use:

```bash
npm test
```