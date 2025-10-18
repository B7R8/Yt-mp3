# CSS Linting Configuration

This project uses Stylelint to lint CSS files and ensure code quality. The configuration has been set up to work with Tailwind CSS.

## Configuration Files

- `.stylelintrc.json` - Main Stylelint configuration
- `.vscode/settings.json` - VS Code settings for CSS validation
- `css-custom-data.json` - Custom CSS data for IDE support

## Available Scripts

- `npm run lint:css` - Run Stylelint and automatically fix issues
- `npm run lint:css:check` - Run Stylelint to check for issues without fixing

## What's Configured

### Ignored At-Rules
The following Tailwind CSS at-rules are ignored by Stylelint:
- `@tailwind` - Tailwind CSS directives
- `@apply` - Apply utility classes
- `@layer` - Layer directives
- `@import` - Import statements

### Disabled Rules
- `no-descending-specificity` - Disabled for better Tailwind CSS compatibility
- `declaration-property-value-keyword-no-deprecated` - Allows deprecated CSS values

## IDE Integration

The configuration includes VS Code settings that:
- Disable built-in CSS validation (which doesn't understand Tailwind)
- Enable Stylelint validation
- Associate CSS files with Tailwind CSS language mode
- Provide custom CSS data for better IntelliSense

## Troubleshooting

If you're still seeing CSS warnings in your IDE:

1. Make sure you have the Stylelint extension installed
2. Restart VS Code after configuration changes
3. Check that the `.vscode/settings.json` file is in the correct location
4. Verify that the `css-custom-data.json` file exists and is properly referenced

## Notes

- The warnings you see in the IDE are from the built-in CSS validator, not Stylelint
- Stylelint runs correctly and doesn't show these warnings
- The configuration is designed to work with both Tailwind CSS v3 and v4 syntax
