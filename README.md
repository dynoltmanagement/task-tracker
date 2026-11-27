# Dynolt Task Tracker

Private team task tracker for Dynolt Technologies. Static site (index.html, app.js) hosted on GitHub Pages, with data, sign-in and permissions in Supabase.

- `config.js` holds the Supabase project URL and the publishable key only. The publishable key is meant to be public; every table is protected by row-level security in Supabase. Never put a secret or service_role key in this repository.
- `vendor/` holds pinned copies of supabase-js, ExcelJS and JSZip, so the site needs no build step.
