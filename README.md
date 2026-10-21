# Expense Splitter

**Document version: 1.2.0**

A responsive expense-sharing app for keeping groups, participants, bills, repayments, and settlements organized. The interface uses Ant Design components and icons.

## Features

- Create and switch between saved groups.
- Add shared expenses with equal, custom amount, share, or percentage splits.
- Record repayments, calculate balances, and suggest a low-payment settlement plan.
- Save point-in-time split snapshots and review account-backed history across groups. Sign-in is only requested for saved snapshots and synced history; the calculator and group editing remain available without an account.
- Keep a reusable list of people.
- Edit profile details, change currency and appearance, and download CSV or JSON backups.
- Save locally by default, import and export JSON backups, and export group activity to CSV. Supabase email sign-in, profile storage, and cloud group sync activate when project credentials are configured.
- Honor reduced-motion preferences and adapt to mobile screens.

## Local development

    npm install
    npm run dev

## Supabase setup

1. Create a Supabase project and configure its URL and publishable (or anon) key in a local .env file using .env.example.
2. Run supabase/migrations/2026102201_expense_splitter_core.sql in the Supabase SQL Editor.
3. Enable email authentication in Supabase Auth. Configure email confirmation according to your deployment.
4. Restart the Vite server. The app then offers optional Supabase Auth and syncs profiles, groups, participants, expenses, payments, saved split snapshots, and settings after sign-in.

The SQL migration creates profile, group, and group-membership tables, adds a profile for new accounts, and enables row-level security. Group expenses and payments are stored as JSONB on their group record for simple account sync.

## Deployment configuration

Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as build-time environment variables in your hosting provider. Never place a service-role key in browser code.
