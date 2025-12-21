# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1f8aefb3-72d8-4862-9bb7-e996dea754a5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1f8aefb3-72d8-4862-9bb7-e996dea754a5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Option 1: Deploy with Lovable

Simply open [Lovable](https://lovable.dev/projects/1f8aefb3-72d8-4862-9bb7-e996dea754a5) and click on Share -> Publish.

### Option 2: Deploy with Docker (Railway, Render, etc.)

This project includes Docker configuration for easy deployment to platforms like Railway, Render, or any Docker-compatible hosting service.

#### Build and test locally:

```sh
# Build the Docker image
docker build -t home-hub-manager .

# Run locally
docker run -p 3000:80 home-hub-manager

# Or use docker-compose
docker-compose up
```

#### Deploy to Railway:

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Dockerfile
3. Set your environment variables in Railway dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if needed)
   - `VITE_VAPID_PUBLIC_KEY` (for push notifications)
   - `SUPABASE_VAPID_PRIVATE_KEY` (for push notifications)
4. Railway will build and deploy automatically

#### Deploy to other platforms:

The Dockerfile uses a multi-stage build:
- **Stage 1**: Builds the React app with Node.js
- **Stage 2**: Serves the static files with nginx

This ensures a small, optimized production image (~50MB) with fast serving.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
