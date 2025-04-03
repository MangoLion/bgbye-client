# Migration Plan: Create React App to Vite

This document outlines the step-by-step process to migrate the BGBye application from Create React App (CRA) to Vite.

## Why Migrate?

- **Performance**: Vite offers faster development server startup and hot module replacement
- **Modern Build Tools**: Uses Rollup for optimized production builds
- **Future-proof**: CRA is no longer actively maintained
- **Better DX**: Improved developer experience with faster refresh times
- **ESM-first**: Native ES modules for better tree-shaking and faster builds

## Pre-Migration Preparation

1. **Create Git Branch**
   ```bash
   git checkout -b migrate-to-vite
   ```

2. **Audit Dependencies**
   - Identify CRA-specific dependencies to remove
   - Check for compatibility issues with existing libraries
   - Document environment variables used in the application

3. **Check Browser Compatibility**
   - Review browserslist configuration in package.json
   - Ensure target browsers are compatible with Vite defaults

## Migration Steps

### 1. Install Vite and Required Dependencies

```bash
npm install --save-dev vite @vitejs/plugin-react vite-plugin-svgr
```

### 2. Configure Vite

Create a `vite.config.js` file in the project root:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      // Set up any path aliases you need
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 9877, // Match the current port
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:9876',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'build', // Keep same output directory as CRA
  },
  // Handle environment variables
  define: {
    'process.env': process.env,
  },
});
```

### 3. Update HTML Entry Point

Modify `public/index.html` to be compatible with Vite:

1. Move `public/index.html` to the project root as `index.html`
2. Update the script tag to point to the main entry point:

```html
<script type="module" src="/src/index.js"></script>
```

3. Replace `%PUBLIC_URL%` references with direct paths:
   - From: `<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />`
   - To: `<link rel="icon" href="/favicon.ico" />`

### 4. Update Package Scripts

Modify `package.json` scripts section:

```json
"scripts": {
  "start": "concurrently \"npm run start-client\" \"npm run start-server\"",
  "start-client": "vite --port 9877",
  "start-server": "cd server && ./run.sh",
  "build": "vite build",
  "preview": "vite preview",
  "setup-server": "cd server && chmod +x setup.sh && chmod +x run.sh && ./setup.sh",
  "deploy": "npm run build && wrangler pages deploy ./build",
  "test": "vitest run"
}
```

### 5. Update Import Statements

Update any import statements that use CRA-specific features:

1. CSS modules:
   - Ensure `.module.css` naming convention for CSS modules

2. SVG imports:
   - Replace: `import { ReactComponent as Logo } from './logo.svg'`
   - With: `import Logo from './logo.svg?react'`

3. Static assets:
   - Replace: `import logo from './logo.png'`
   - With: `import logo from './logo.png'`
   (Syntax is similar, but Vite handles assets differently)

### 6. Environment Variables

1. Create `.env` files for different environments:
   - `.env` - Shared variables
   - `.env.development` - Development-specific variables
   - `.env.production` - Production-specific variables

2. Prefix variables with `VITE_` instead of `REACT_APP_`:
   - From: `REACT_APP_API_URL=...`
   - To: `VITE_API_URL=...`

3. Update how environment variables are accessed in code:
   - From: `process.env.REACT_APP_API_URL`
   - To: `import.meta.env.VITE_API_URL`

### 7. Update Testing Setup

1. Install Vitest for testing:
   ```bash
   npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
   ```

2. Create `vitest.config.js`:
   ```javascript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./src/setupTests.js'],
     },
   });
   ```

3. Update test imports and configurations 

### 8. Update Cloudflare Pages Configuration

1. Update `wrangler.toml` if needed:
   ```toml
   [build]
   command = "npm run build"
   destination = "build"
   ```

2. Update build settings in Cloudflare Pages dashboard

## Post-Migration Tasks

1. **Test in Development**
   - Start the development server: `npm run start-client`
   - Ensure all features work correctly
   - Fix any issues that arise

2. **Test Production Build**
   - Build the application: `npm run build`
   - Serve locally: `npm run preview`
   - Verify production build works correctly

3. **Update Documentation**
   - Update README.md with new development instructions
   - Update CLAUDE.md with new build/run commands

4. **Clean Up**
   - Remove CRA-specific dependencies:
     ```bash
     npm uninstall react-scripts
     ```
   - Remove any unused configuration files (e.g., `config-overrides.js`)

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "Migrate from Create React App to Vite"
   git push origin migrate-to-vite
   ```

6. **Create PR and Deploy**
   - Create pull request to merge changes into main branch
   - Test deployment on staging environment
   - Merge and deploy to production

## Troubleshooting Common Issues

### Module Resolution Problems
- Check path aliases in vite.config.js
- Ensure correct usage of import.meta.env vs process.env

### CSS/SCSS Issues
- Make sure to use the correct import syntax for CSS modules
- Add appropriate plugins if using SCSS/SASS

### Build Optimization Issues
- Check bundling configuration in vite.config.js
- Adjust chunk size and splitting options as needed

### Testing Failures
- Update mocks and test utilities to be compatible with Vitest
- Ensure test files use the correct import patterns

## Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [Vite React Plugin](https://github.com/vitejs/vite/tree/main/packages/plugin-react)
- [Migrating from CRA to Vite](https://vitejs.dev/guide/migration-from-cra.html)
- [Vitest Documentation](https://vitest.dev/guide/)