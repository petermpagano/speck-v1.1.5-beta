# Icon Setup Instructions

## Using Your Custom Icon

You have a beautiful orange blob icon! Here's how to add it:

### 1. Save Your Icon Image

Save your icon as:
- `vscode-extension/icon.png` - For the extension marketplace (128x128 pixels recommended)
- `vscode-extension/icons/file-icon.svg` - For `.speck` file icons in the file explorer

### 2. Update After Adding Icon

After placing your icon files, run:

```bash
xcopy /E /I vscode-extension "%USERPROFILE%\.vscode\extensions\speckjs-0.1.0"
```

Then reload VS Code.

### Icon Requirements

**Extension Icon (icon.png):**
- Size: 128x128 pixels minimum
- Format: PNG with transparency
- Shown in: VS Code Extensions marketplace and sidebar

**File Icon (icons/file-icon.svg):**
- Size: 32x32 pixels (or scalable SVG)
- Format: SVG or PNG
- Shown in: File explorer next to `.speck` files

### Current Setup

I've created a placeholder SVG icon. Replace it with your actual icon image for the best look!

The icon configuration is already set in `package.json` - just add your image files and reload.
