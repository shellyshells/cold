# Fridgy Development Conventions

## Naming Conventions

### General Rules
- **Language**: All code, comments, and documentation in English
- **Clarity over brevity**: Use descriptive names that explain purpose
- **Consistency**: Follow the same style throughout the project

### Variables & Functions
- **Style**: camelCase for JavaScript, snake_case for Python
- **Functions**: Start with verbs (e.g., `calculateTotal`, `fetch_user_data`)
- **Booleans**: Prefix with `is`, `has`, or `can` (e.g., `isValid`, `hasAccess`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `API_BASE_URL`)

### Files & Folders
- **Python files**: snake_case (e.g., `data_service.py`, `user_routes.py`)
- **JavaScript files**: camelCase (e.g., `api.js`, `dashboard.js`)
- **CSS files**: kebab-case (e.g., `main-style.css`, `dashboard.css`)
- **Folders**: lowercase with hyphens (e.g., `user-data`, `css-modules`)

### Classes & Types
- **Style**: PascalCase (e.g., `UserProfile`, `PaymentService`)

## Git Workflow

### Branch Naming
Format: `<type>/<description>`

Types:
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/modifications
- `chore/` - Maintenance tasks

Examples:
- `feat/user-authentication`
- `fix/null-pointer-exception`
- `refactor/database-layer`

### Commit Messages
Format:
```
<type>: <short description>

- Detailed change 1
- Detailed change 2
- Detailed change 3

[Optional: Additional context or reasoning]
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

Examples:
```
feat: add user authentication endpoint

- Implement JWT token generation
- Add login and logout routes
- Include password hashing with bcrypt

This provides secure user authentication following OAuth 2.0 standards.
```
```
fix: resolve food expiry calculation bug

- Correct timezone handling in date comparison
- Add test case for edge case scenario
- Update error logging for better debugging

Bug was causing items to show as expired one day early.
```

### Pull Request Guidelines
- **Size**: Keep PRs under 400 lines when possible
- **Description**: Explain what, why, and how
- **Testing**: Include test results or manual testing steps
- **Screenshots**: Add for UI changes
- **Review**: Request review from at least one team member

## Code Formatting

### Python
- **Formatter**: Black (line length: 88)
- **Linter**: Flake8
- **Import order**: stdlib, third-party, local
- **Docstrings**: Google style

### JavaScript
- **Formatter**: Prettier (line length: 100)
- **Linter**: ESLint
- **Quotes**: Single quotes for strings
- **Semicolons**: Required

### Running Formatters
```bash
# Python
black backend/ --line-length 88
flake8 backend/ --max-line-length=88

# JavaScript (if configured)
prettier --write frontend/js/
```

## Logging

### Log Levels
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages
- `WARNING`: Warning messages for potentially harmful situations
- `ERROR`: Error events that might still allow the app to continue
- `CRITICAL`: Severe error events that may cause termination

### Log Format
```python
# Python
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s [%(name)s] %(message)s'
)
logger = logging.getLogger('fridgy')
logger.info('User %s logged in successfully', user_id)
```

### What NOT to Log
- Passwords or authentication tokens
- Personal identifying information (PII)
- Credit card numbers
- Session tokens
- API keys

## Error Handling

### Python
```python
try:
    result = risky_operation()
except SpecificException as e:
    logger.error('Operation failed: %s', e, exc_info=True)
    return {"error": "User-friendly error message"}, 500
```

### JavaScript
```javascript
try {
    const data = await api.fetchData();
    return data;
} catch (error) {
    console.error('Failed to fetch data:', error);
    showUserMessage('Failed to load data. Please try again.');
    throw error;
}
```

## Testing

### Coverage Goals
- Focus on business logic and critical paths
- Unit tests for service layer functions
- Integration tests for API endpoints
- Regression tests for fixed bugs

### Test Naming
```python
def test_calculate_total_with_valid_items():
    """Test that calculate_total returns correct sum for valid items."""
    # Arrange
    items = [{"price": 10}, {"price": 20}]
    
    # Act
    result = calculate_total(items)
    
    # Assert
    assert result == 30
```

## Security Basics

### Input Validation
- Validate all user inputs on the backend
- Sanitize data before processing
- Use parameterized queries (even for JSON)

### Secrets Management
- Never commit secrets to version control
- Use environment variables or vault solutions
- Add sensitive files to `.gitignore`

### Dependencies
- Keep dependencies up to date
- Review security advisories regularly
- Use `pip install --break-system-packages` on Ubuntu 24

## Code Review Checklist

- [ ] Code follows naming conventions
- [ ] No sensitive data in logs or errors
- [ ] Error handling implemented
- [ ] Functions have single responsibility
- [ ] No code duplication (DRY)
- [ ] Simple solution chosen (KISS)
- [ ] No premature optimization (YAGNI)
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed

## Resources

- [Python Style Guide (PEP 8)](https://pep8.org/)
- [JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
```

### .gitignore
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.pytest_cache/
.coverage
htmlcov/
*.log

# Virtual Environment
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Project specific
backend/food_data.json
*.tmp

# Node modules (if added later)
node_modules/
package-lock.json

# Environment variables
.env