# Publishing Speck.js to npm

## Overview

Speck.js is published as `create-speck-app` on npm, allowing users to scaffold new projects with:

```bash
npm create speck-app my-app
```

## Prerequisites

1. **npm account** - Create at https://npmjs.com
2. **Email verified** on npm
3. **2FA enabled** (recommended)

## First Time Setup

### 1. Login to npm

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- 2FA code (if enabled)

### 2. Verify Login

```bash
npm whoami
```

Should show your npm username.

## Publishing Steps

### 1. Prepare the Template

The `create-speck-app/template/` folder contains the starter project. Make sure it's up to date:

- Copy current project structure
- Include latest compiler
- Update dependencies
- Test it works!

### 2. Update Version

```bash
cd create-speck-app

# For bug fixes
npm version patch  # 0.1.0 → 0.1.1

# For new features
npm version minor  # 0.1.0 → 0.2.0

# For breaking changes
npm version major  # 0.1.0 → 1.0.0
```

### 3. Test Locally

Before publishing, test the scaffolding tool:

```bash
# Make it executable
chmod +x index.js

# Test it
node index.js test-app
cd test-app
npm install
npm run dev

# Clean up
cd ..
rm -rf test-app
```

### 4. Publish to npm

```bash
cd create-speck-app
npm publish
```

First time? You might need:
```bash
npm publish --access public
```

### 5. Verify

```bash
# Wait 1-2 minutes for npm to update
npm create speck-app test-app
```

## Update Checklist

Before each release:

- [ ] Test compiler changes
- [ ] Update template dependencies
- [ ] Update version in `package.json`
- [ ] Test scaffolding locally
- [ ] Update CHANGELOG.md
- [ ] Create Git tag
- [ ] Publish to npm
- [ ] Test installation
- [ ] Update main README

## Package Structure

```
create-speck-app/
├── package.json       # Package metadata
├── index.js           # CLI entry point
├── README.md          # Package docs
└── template/          # Project template
    ├── compiler/      # Speck compiler
    ├── src/           # Starter components
    ├── index.html
    ├── package.json   # Template dependencies
    ├── vite.config.js
    └── nodemon.json
```

## Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.0.1): Bug fixes

## Common Issues

### "You must verify your email"
- Go to npmjs.com → Settings → verify email

### "Package already exists"
- Name is taken, choose different name
- Or request ownership if it's yours

### "Forbidden"
- You're not logged in: `npm login`
- Package is private: `npm publish --access public`

### "ENEEDAUTH"
- Auth token expired: `npm login` again

## Post-Publishing

1. **Announce on Twitter/LinkedIn**
2. **Update main README** with npm badge
3. **Create GitHub release** with changelog
4. **Test on fresh machine** to verify installation

## npm Badge

Add to README:

```markdown
[![npm version](https://badge.fury.io/js/create-speck-app.svg)](https://www.npmjs.com/package/create-speck-app)
```

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Publishing Packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
