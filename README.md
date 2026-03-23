# Atlas MVP

Atlas MVP is an AI-native hybrid-rail financial OS for micro-multinationals.

## Overview
Atlas is a demo application built to showcase the Atlas Financial OS experience. It is intended for deployment on Railway and for review by investors, partners, and internal stakeholders.

## Features
- Demo dashboard experience.
- Node.js application.
- SQLite-backed data storage.
- Railway-friendly deployment flow.
- Custom domain support for `demo.getatlasos.com`.

## Live Demo
https://demo.getatlasos.com

## Deploy on Railway
1. Push this repository to GitHub.
2. Open Railway and create a new project.
3. Connect this GitHub repository.
4. Deploy the app.
5. Add the custom domain `demo.getatlasos.com`.
6. Update your DNS with the CNAME value from Railway.

## Local Development
If you want to run the app locally:
1. Install dependencies.
2. Start the Node.js app using the project scripts.
3. Open the local URL shown in your terminal.

## Notes
- This is an MVP/demo build.
- The app uses SQLite, so no separate database service is required.
- Railway handles build, deployment, and SSL for the custom domain.

## Support
If deployment fails, check the Railway logs and confirm the DNS record is set correctly.
