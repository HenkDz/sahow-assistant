---
inclusion: always
---

# Package Manager Guidelines

## Required Package Manager: Bun

This workspace uses **bun** as the preferred package manager. Always use `bun` commands instead of `npm` or `yarn`.

### Command Mappings

Replace npm commands with bun equivalents:

- `npm install` → `bun install`
- `npm install <package>` → `bun add <package>`
- `npm install --save-dev <package>` → `bun add --dev <package>`
- `npm uninstall <package>` → `bun remove <package>`
- `npm run <script>` → `bun run <script>` or `bun <script>`
- `npm test` → `bun test`
- `npm start` → `bun start`
- `npm run build` → `bun run build`
- `npm list` → `bun pm ls`

### Key Benefits of Bun

- Faster installation and execution
- Built-in bundler and test runner
- Better performance for development workflows
- Native TypeScript support

### Important Notes

- Always use `bun` commands when installing dependencies
- Use `bun run` for npm scripts or the shorthand `bun <script>`
- For testing, prefer `bun test` over `npm test`
- When checking dependencies, use `bun pm ls` instead of `npm list`

This ensures consistency across the development workflow and takes advantage of bun's performance benefits.