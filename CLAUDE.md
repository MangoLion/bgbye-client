# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Run Commands
- Install dependencies: `npm install`
- Setup server: `npm run setup-server` (requires restart of terminal after)
- Start application: `npm start` (runs both client and server)
- Start client only: `npm run start-client`
- Start server only: `npm run start-server`
- Build: `npm run build`
- Test: `npm run test`
- Lint: Automatically runs during development (configured in eslintConfig in package.json)

## Common Issues
- Server fails with module errors: Ensure `onnxruntime-gpu` is installed in the Python environment
- If setup fails with dependency errors, check for proper system packages:
  - Replace `libgl1-mesa-glx` with `libgl1` on newer Ubuntu versions
  - For AMD GPUs: Edit server/setup.sh to use `--index-url https://download.pytorch.org/whl/rocm6.0`

## Known Warnings
The following warnings appear during server startup but don't affect functionality:

- `albumentations` version update warnings
- PyTorch `torch.load` security warnings (future change to `weights_only=True`)
- Hugging Face model download warnings
- PyTorch deprecation warnings about:
  - `size_average` and `reduce` args
  - `torch.meshgrid` indexing
  - `pretrained` parameter in torchvision
- FastAPI `on_event` deprecation (should use lifespan events)

These warnings can be addressed in future updates but don't impact the current application.

## Project Notes
- This project currently uses Create React App (CRA), which is now deprecated
- Future plans include migrating to Vite for improved performance and modern tooling
- The project is configured for Cloudflare Pages deployment

## Code Style Guidelines
- **React (Frontend)**: Uses React with MUI components
- **Python (Backend)**: FastAPI with PyTorch for AI models
- **Naming**: camelCase for JS variables/functions, snake_case for Python
- **Error Handling**: Use try/catch in JS, try/except with proper logging in Python
- **Imports**: Group React component imports separately from MUI imports
  - Remove unused imports to avoid ESLint warnings
- **State Management**: Use React hooks (useState, useEffect, useCallback)
- **API Calls**: Use axios for frontend HTTP requests
- **File Structure**: Components in src/components/, server code in server/
- **GPU Management**: Use CUDA when available, properly free memory with torch.cuda.empty_cache()
- **JS Comparisons**: Use strict equality (===) instead of loose equality (==)
- **React Props**: Follow proper prop naming conventions for MUI components