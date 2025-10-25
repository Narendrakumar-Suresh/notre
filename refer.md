project_root/
├── .output/            # Final build output (server/client bundles, etc.)
├── .vinxi/             # Vinxi framework internals (routing manifests, etc.)
├── node_modules/       # Installed dependencies
├── public/             # Static assets
│   └── ...             # (favicon, images, robots.txt)
│
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Button.tsx
│   │   └── Footer.tsx
│   │
│   ├── pages/          # Route-based page components
│   │   ├── index.tsx
│   │   ├── about.tsx
│   │
│   ├── app.css         # Global CSS entry point (imported in entry-client)
│   │
│   ├── entry-client.tsx # Client-side app hydration/bootstrap
│   ├── entry-server.tsx # Server-side entry (SSR render)
│
├── .gitignore
├── app.config.ts        # Framework config (routing, adapters, SSR/CSR setup)
├── package.json
├── tailwind.config.ts   # TailwindCSS config
└── tsconfig.json        # TypeScript config
