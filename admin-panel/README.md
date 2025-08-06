# Tax Filing Admin Panel

This is the admin panel for the Tax Filing Mobile App project.

## Structure

```
admin-panel/
├── frontend/     # React.js admin dashboard
└── backend/      # Flask API server
```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The React app will run on `http://localhost:3000`

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   ```bash
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies (already done):
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following content:
   ```
   SECRET_KEY=your-super-secret-key-change-this-in-production
   JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production
   DATABASE_URL=sqlite:///admin_panel.db
   FLASK_ENV=development
   ```

5. Run the Flask server:
   ```bash
   python app.py
   ```

The Flask API will run on `http://localhost:5000`

## Features

- **Frontend**: React.js admin dashboard
- **Backend**: Flask API with JWT authentication
- **Database**: SQLAlchemy with SQLite (can be changed to PostgreSQL/MySQL)
- **CORS**: Enabled for frontend-backend communication 