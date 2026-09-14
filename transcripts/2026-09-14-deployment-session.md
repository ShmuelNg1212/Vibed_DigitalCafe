# Digital Cafe Deployment Session Transcript

**Date:** 2026-09-14

**Repository:** `https://github.com/ShmuelNg1212/Vibed_DigitalCafe.git`

**Purpose:** Start the local app, connect its database, deploy it to Vercel with
a hosted Neon PostgreSQL database, and document how the deployed system works.

## Transcript

### User

run this app pls

### Assistant

Inspected the repository and found a Next.js application with a `dev` script in
`package.json`. Started the development server with `npm run dev`.

The app became available at:

- `http://localhost:3000`
- `http://10.89.0.90:3000`

Verified the local server returned HTTP 200.

### User

can you connect the database and restart the dev server

### Assistant

Inspected Prisma configuration, the schema, `.env`, and the database helper.
The configured local database target was a Prisma Dev PostgreSQL database on
`localhost:51214`, but the Prisma Dev server was stopped.

Started the existing Prisma Dev server named `digitalcafe`, then applied the
existing migrations. The local database started successfully and migrations
were already current.

Seeded the database and verified:

- Database connection: OK
- Latest migration: `20260914110000_add_order_customer_snapshots`
- Active products: 12

Stopped and restarted the Next.js development server. Verified the app again at
`http://localhost:3000` with HTTP 200.

### User

how should i deploy this app so that people can easily access it.

### Assistant

Recommended deploying the Next.js application to Vercel and using a managed
PostgreSQL provider such as Neon or Supabase. Explained that the local Prisma
Dev database must not be used by production, and that production requires:

- A hosted PostgreSQL `DATABASE_URL`
- A stable random `SESSION_SECRET`
- `TAX_RATE_BPS`
- `NEXT_PUBLIC_TAX_RATE_BPS`
- Applied Prisma migrations
- Intentional seed data

Recommended GitHub-connected Vercel deployments and a custom domain through
Vercel.

### User

can you conduct the process you just outlined and follow the necessary workflow steps.

### Assistant

Followed the repository workflow:

```text
study => plan => execute plan => rendezvous => sync docs
```

Created the deployment branch:

```text
chore/vercel-deployment
```

Reviewed the repository state, GitHub remote, deployment configuration, Prisma
schema, and current build. The production build passed locally.

Created and used these documents:

- `doc/study/013-vercel-deployment-study.md`
- `doc/plan/013-vercel-deployment-plan.md`

Authenticated the Vercel CLI. Created the Vercel project `digitalcafe` and
detected the project as a Next.js application.

Connected the Vercel project to the GitHub repository. The first connection
attempt required a Vercel GitHub Login Connection; after that was approved, the
repository connection succeeded.

Created a Neon PostgreSQL resource named `digitalcafe-db` through the Vercel
Marketplace integration. Neon automatically added its database environment
variables to the Vercel project, including `DATABASE_URL`.

The production database was prepared using the hosted Neon URL:

1. Applied all three Prisma migrations with `npx prisma migrate deploy`.
2. Ran `npx prisma db seed`.
3. Ran `npm run db:check`.

Database verification succeeded:

- Connection: OK
- Latest migration: `20260914110000_add_order_customer_snapshots`
- Active products: 12

Configured these Vercel Production variables:

- `DATABASE_URL`, supplied by Neon
- `SESSION_SECRET`, generated with `openssl rand -base64 32`
- `TAX_RATE_BPS=0`
- `NEXT_PUBLIC_TAX_RATE_BPS=0`

Updated the living documentation:

- `doc/wiki/setup.md`: added production deployment and hosted database setup
- `doc/wiki/architecture.md`: documented the Vercel and Neon production boundary

Deployed with:

```bash
npx vercel deploy --prod --yes
```

The production deployment completed successfully. Vercel assigned these URLs:

- Deployment URL: `https://digitalcafe-emu2f7elt-shmuelng8310-5097s-projects.vercel.app`
- Production alias: `https://digitalcafe-neon.vercel.app`

Verified the production alias:

- HTTP response: 200
- Catalog rendered successfully
- `Digital Cafe` was present in the response
- `House Latte` was present in the response
- Vercel deployment logs showed a successful build and deployment

Committed the workflow documentation using:

```text
docs: document Vercel production deployment
```

Merged `chore/vercel-deployment` into `main` and pushed `main` to GitHub.

### User

can you explain how vercel works and what needs to be running for the webapp to work with the vercel domain.

### Assistant

Explained that Vercel hosts the deployed Next.js frontend, server-rendered
pages, API routes, static assets, and serverless functions. There is normally
no continuously running Node.js process on the developer's machine or on the
Vercel deployment.

Described the production request flow:

```text
Visitor browser
    -> Vercel HTTPS domain
    -> Next.js serverless page or API route
    -> Prisma
    -> Neon PostgreSQL
```

Clarified that these local services do not need to remain running for the
public site:

- `npm run dev`
- Local Prisma Dev
- Local PostgreSQL
- The developer's terminal
- The developer's computer
- A local tunnel

Explained that the production requirements are the Vercel deployment, Neon,
the Vercel environment variables, and DNS configuration if a custom domain is
added. Also explained that production migrations are applied separately with
`prisma migrate deploy`, rather than automatically during every Vercel build.

### User

can you add a full transcript of this session in the transcripts folder.

### Assistant

Created this transcript file in the `transcripts` folder. Secrets and raw
credentials were intentionally omitted; only variable names, public URLs, and
non-sensitive deployment details are included.

## Final Deployment State

- Public app: `https://digitalcafe-neon.vercel.app`
- Vercel project: `digitalcafe`
- Hosted database: Neon PostgreSQL
- Database migrations: applied
- Seeded active products: 12
- Production environment variables: configured in Vercel
- GitHub repository: connected to Vercel
- `main`: pushed to GitHub

## Security Note

The seed includes demo accounts for local and demo use. Before using the public
deployment for real customers, change or remove the demo account credentials.
Production secrets such as `DATABASE_URL` and `SESSION_SECRET` are not included
in this transcript.
