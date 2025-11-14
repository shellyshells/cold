# Fridgy - Smart Food Management System

## Overview
Fridgy is a web application that helps users track food inventory, manage recipes, log meals, and monitor health metrics to reduce food waste and maintain a healthy lifestyle.

## Project Objectives
This project demonstrates best practices in software development:
- KISS, DRY, YAGNI, and separation of responsibilities principles
- Consistent naming conventions and code formatting
- Error handling and observability through logging
- Basic security practices
- Comprehensive testing approach

## Tech Stack
- **Backend**: Python 3.x with Flask
- **Frontend**: Vanilla JavaScript with HTML5/CSS3
- **Data Storage**: JSON file-based storage
- **Testing**: Pytest for backend

## Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd fridgy

# Install backend dependencies
cd backend
pip install -r requirements.txt --break-system-packages

# Run the backend server
python app.py
```

The backend will start on `http://localhost:8080`

### Running the Frontend
```bash
# From project root
cd frontend
python -m http.server 3000
```

Access the application at `http://localhost:3000`

## Project Structure
```
fridgy/
├── backend/
│   ├── app.py              # Flask application setup
│   ├── data_service.py     # Data persistence layer
│   ├── routes/             # API route blueprints
│   └── tests/              # Backend tests
├── frontend/
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript modules
│   └── *.html              # HTML pages
└── docs/                   # Additional documentation
```

## Team Conventions
See [CONVENTIONS.md](CONVENTIONS.md) for detailed coding standards.

## Testing
```bash
cd backend
pytest tests/
```

## Contributing
1. Create a feature branch from `main`
2. Follow naming conventions in CONVENTIONS.md
3. Write tests for new features
4. Submit a pull request with clear description

## License
MIT License

## Authors
- Developer A - Backend & Architecture
- Developer B - Frontend & UX