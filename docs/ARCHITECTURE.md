# Fridgy Architecture Notes

## Overview
Fridgy follows a client-server architecture with clear separation between frontend UI and backend API.

## Architecture Principles Applied

### KISS (Keep It Simple, Stupid)
- Simple REST API design with standard HTTP methods
- Straightforward JSON data storage instead of complex database
- Vanilla JavaScript instead of heavy frameworks
- Direct file manipulation for data persistence

### DRY (Don't Repeat Yourself)
- Single `FoodAPI` class handles all backend communication
- Centralized data service layer (`data_service.py`) for file operations
- Reusable CSS components with CSS variables
- Common error handling patterns across all pages

### YAGNI (You Aren't Gonna Need It)
- No premature optimization or caching layers
- Basic authentication not implemented (not required yet)
- No complex state management (vanilla JS sufficient)
- Simple file-based storage instead of database

### Separation of Responsibilities
- **Backend**:
  - `app.py`: Flask configuration and route registration
  - `data_service.py`: Data persistence operations
  - `routes/`: Separate modules for each resource (foods, recipes, meals, etc.)
  
- **Frontend**:
  - `js/api.js`: All API communication
  - `js/[page].js`: Page-specific UI logic
  - `css/style.css`: Common styles
  - `css/[page].css`: Page-specific styles

## Data Flow

### Adding a Food Item
```
User Input (food.html)
    ↓
FoodPage.setupForm() (food.js)
    ↓
FoodAPI.addFood() (api.js)
    ↓
POST /api/foods
    ↓
foods_bp.handle_foods() (routes/foods.py)
    ↓
save_data() (data_service.py)
    ↓
food_data.json updated
```

### Meal Nutrition Calculation
```
User logs meal with food IDs
    ↓
POST /api/meals
    ↓
meals_bp.handle_meals()
    ↓
Loads food data from JSON
    ↓
Calculates nutrition by summing food nutrition × quantity
    ↓
Returns meal with calculated nutrition
    ↓
Frontend displays nutrition breakdown
```

## Error Handling Strategy

### Backend
- Global exception handler catches uncaught errors
- Returns generic error messages (no internal details exposed)
- Logs full stack traces server-side
- Validates input and returns specific error messages

### Frontend
- API wrapper checks connection on initialization
- Displays user-friendly error messages
- Handles network failures gracefully
- Provides loading states during operations

## Security Considerations

### Implemented
- CORS configured for development
- No sensitive data in logs
- Input sanitization (trim, filter)
- Error messages don't expose internals

### Not Implemented (Future)
- Authentication/Authorization
- Rate limiting
- Input validation beyond basic checks
- SQL injection protection (not applicable - using JSON)
- XSS protection (minimal risk with current implementation)

## Testing Strategy

### Backend Tests
- Integration tests for API endpoints
- Isolated data file per test (pytest fixtures)
- Tests for CRUD operations
- Tests for nutrition calculation logic

### Frontend Tests
- Manual testing performed
- No automated frontend tests (future improvement)

## Deployment Notes

### Development
- Backend: `python backend/app.py` (port 8080)
- Frontend: `python -m http.server 3000` from frontend/

### Production Considerations
- Use production WSGI server (Gunicorn)
- Enable HTTPS
- Restrict CORS origins
- Use environment variables for configuration
- Consider database migration from JSON
- Add proper logging service

## Known Limitations

1. **No Authentication**: Anyone can access and modify data
2. **No Concurrent Access**: JSON file writes may conflict
3. **No Data Validation**: Limited validation on backend
4. **No Image Upload**: Food items don't support photos
5. **No Mobile App**: Web-only interface
6. **Single User**: No multi-user support

## Future Improvements

### High Priority
- User authentication and authorization
- Database migration (PostgreSQL/MongoDB)
- Input validation library (e.g., Marshmallow)
- Automated tests for frontend

### Medium Priority
- Food image upload capability
- Barcode scanning for food entry
- Recipe import from URLs
- Export data feature (CSV/PDF)

### Low Priority
- Mobile app (React Native)
- Social features (share recipes with friends)
- AI meal recommendations
- Integration with fitness trackers

## Technology Choices

### Why Flask?
- Lightweight and simple
- Perfect for small to medium projects
- Easy to learn and debug
- Extensive documentation

### Why Vanilla JavaScript?
- No framework overhead
- Fast page loads
- Direct DOM manipulation sufficient
- Easier to debug for beginners

### Why JSON File Storage?
- Simple to implement
- No database setup required
- Easy to inspect and debug
- Sufficient for single-user prototype
- Can migrate to database later

### Why Chart.js?
- Popular and well-maintained
- Simple API
- Good documentation
- Responsive charts out of the box

## Code Organization Rationale

### Backend Structure
```
backend/
├── app.py              # Central app config
├── data_service.py     # Single source for data operations
├── routes/             # One file per resource
│   ├── foods.py
│   ├── recipes.py
│   └── meals.py
└── tests/              # Integration tests
```

### Frontend Structure
```
frontend/
├── css/
│   ├── style.css       # Common styles
│   └── [page].css      # Page-specific styles
├── js/
│   ├── api.js          # Centralized API communication
│   └── [page].js       # Page-specific logic
└── *.html              # One HTML file per page
```

This structure makes it easy to find code and follows the single responsibility principle.