# Speck.js Extension Development

## Testing the Extension Locally

### Option 1: Copy to VS Code Extensions Folder

1. **Copy the extension folder:**
   ```bash
   # Windows
   xcopy /E /I vscode-extension %USERPROFILE%\.vscode\extensions\speckjs-0.1.0
   
   # Mac/Linux
   cp -r vscode-extension ~/.vscode/extensions/speckjs-0.1.0
   ```

2. **Reload VS Code:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Reload Window"
   - Press Enter

3. **Test it:**
   - Open any `.speck` file
   - You should see syntax highlighting!

### Option 2: Use VS Code Extension Development Host

1. **Open the extension folder in VS Code:**
   ```bash
   code vscode-extension
   ```

2. **Press F5** - This opens a new VS Code window with the extension loaded

3. **Open a `.speck` file** in the new window to test

## Building for Distribution

### Install VSCE (VS Code Extension Manager)
```bash
npm install -g @vscode/vsce
```

### Package the Extension
```bash
cd vscode-extension
vsce package
```

This creates a `.vsix` file you can:
- Install locally: `code --install-extension speckjs-0.1.0.vsix`
- Share with others
- Publish to VS Code Marketplace

## Publishing to VS Code Marketplace

1. **Create a Publisher Account:**
   - Go to https://marketplace.visualstudio.com/manage
   - Create a publisher ID

2. **Get a Personal Access Token:**
   - Visit Azure DevOps
   - Create a PAT with Marketplace publish permissions

3. **Login and Publish:**
   ```bash
   vsce login <your-publisher-name>
   vsce publish
   ```

## Testing Checklist

- [ ] Syntax highlighting works for all Speck tags
- [ ] `<script>` blocks show JavaScript syntax
- [ ] `{expressions}` are highlighted correctly
- [ ] Snippets work (type `speck` + Tab)
- [ ] Auto-closing pairs work for tags
- [ ] Indentation is correct
- [ ] Comments work (`//` and `/* */`)

## Troubleshooting

**Extension not loading?**
- Check the extension is in the correct folder
- Reload VS Code window
- Check the Output panel for errors

**Syntax highlighting not working?**
- Make sure the file has `.speck` extension
- Check the language mode in bottom-right corner of VS Code
- It should say "Speck"

**Need to make changes?**
- Edit files in `vscode-extension/`
- Reload the extension window (if using F5)
- Or re-copy to extensions folder
