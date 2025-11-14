# Bug Report - Recipe Ingredients Parsing Issue

## Bug ID
BUG-001

## Date Discovered
During code review by Michel

## Severity
Medium

## Status
✅ Fixed

## Description
When adding a recipe, empty lines in the ingredients textarea were being parsed as empty strings and displayed as blank ingredient tags.

## Steps to Reproduce
1. Navigate to Recipes page
2. Click "Add Recipe"
3. Enter recipe name and instructions
4. In ingredients textarea, enter:
```
   2 cups flour
   
   1 cup milk
   
   3 eggs
```
5. Submit form
6. Observe blank ingredient tags between valid ingredients

## Expected Behavior
Empty lines should be filtered out and only valid ingredient strings should be displayed as tags.

## Actual Behavior
Empty strings were included in the ingredients array and displayed as empty blue tags.

## Root Cause
The `split('\n')` method was creating array elements for every line, including empty ones. No filtering was applied to remove empty strings.
```javascript
// Buggy code
ingredients: document.getElementById('recipe-ingredients').value.split('\n')
```

## Solution
Added `map()` to trim whitespace and `filter()` to remove empty strings:
```javascript
// Fixed code
ingredients: document.getElementById('recipe-ingredients').value
    .split('\n')
    .map(i => i.trim())
    .filter(i => i !== '')
```

## Fix Commit
`fix/recipe-empty-ingredients` - Merged into `feat/frontend-ui`

## Prevention
- Add validation testing for edge cases (empty inputs, whitespace)
- Consider implementing form validation to prevent empty lines
- Add unit tests for parsing functions

## Testing Performed
- Manual testing with various textarea inputs
- Confirmed empty lines are now ignored
- Verified valid ingredients still display correctly

## Lessons Learned
Always sanitize user input, even for simple text fields. Trimming and filtering should be standard practice for any array-building operation from text input.