# Tax Filing Mobile App - Admin Panel

A comprehensive admin panel for managing tax filing services, built with React frontend and Flask backend.

## 🚀 Features

### Admin Panel Features
- **Dashboard Overview** - Real-time statistics and insights
- **User Management** - View and manage user accounts
- **Application Tracking** - Monitor tax filing applications
- **Payment Processing** - Track payment status and history
- **Scheduled Calls** - Manage client consultation appointments
- **Feedback System** - Handle user feedback and support requests
- **Support Requests** - Process customer inquiries and issues
- **Profile Management** - Admin profile editing and settings

### Technical Features
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Collapsible Sidebar** - Space-efficient navigation
- **Modern UI/UX** - Clean, professional interface
- **Real-time Updates** - Dynamic data management
- **Search & Filter** - Advanced data filtering capabilities

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **CSS3** - Custom styling with responsive design
- **SVG Icons** - Scalable vector graphics

### Backend
- **Flask 2.3.3** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Flask-SQLAlchemy** - Database ORM
- **Flask-JWT-Extended** - Authentication and authorization
- **Python-dotenv** - Environment variable management

## 📁 Project Structure

```
Tax Filling Mobile App/
├── admin-panel/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Header.css
│   │   │   │   ├── Sidebar.js
│   │   │   │   └── Sidebar.css
│   │   │   ├── pages/
│   │   │   │   ├── Homepage.jsx
│   │   │   │   ├── Homepage.css
│   │   │   │   ├── Users.jsx
│   │   │   │   ├── Applications.jsx
│   │   │   │   ├── Payments.jsx
│   │   │   │   ├── ScheduledCalls.jsx
│   │   │   │   ├── Feedbacks.jsx
│   │   │   │   ├── SupportRequests.jsx
│   │   │   │   ├── Logout.jsx
│   │   │   │   └── Profile.jsx
│   │   │   ├── App.js
│   │   │   └── App.css
│   │   ├── package.json
│   │   └── README.md
│   └── backend/
│       ├── requirements.txt
│       └── README.md
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8 or higher
- Git

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd admin-panel/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd admin-panel/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run Flask server:**
   ```bash
   python app.py
   ```

## 📱 Admin Panel Screens

### 1. Dashboard (Homepage)
- Overview statistics
- Recent activities
- Quick actions

### 2. User Management
- View all users
- User details and status
- Search and filter users

### 3. Applications
- Track tax filing applications
- Application status updates
- Document management

### 4. Payments
- Payment history
- Payment status tracking
- Financial reports

### 5. Scheduled Calls
- Appointment management
- Call scheduling
- Notes and follow-ups

### 6. Feedbacks
- User feedback system
- Response management
- Feedback analytics

### 7. Support Requests
- Customer support tickets
- Issue tracking
- Resolution management

### 8. Profile Management
- Admin profile editing
- Account settings
- Security preferences

## 🎨 UI Components

### Navigation
- **Collapsible Sidebar** - Toggle between expanded/collapsed view
- **Header** - Logo and profile dropdown
- **Responsive Design** - Adapts to different screen sizes

### Interactive Elements
- **Search Functionality** - Real-time search across data
- **Status Updates** - Dynamic status management
- **Form Handling** - Input validation and submission
- **Modal Dialogs** - Confirmation and editing dialogs

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
```

### API Endpoints
The backend provides RESTful API endpoints for:
- User management
- Application tracking
- Payment processing
- Feedback handling
- Support ticket management

## 🚀 Deployment

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```

2. Deploy to your preferred hosting service (Netlify, Vercel, etc.)

### Backend Deployment
1. Set up your production environment
2. Configure environment variables
3. Deploy to your preferred hosting service (Heroku, AWS, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@equitastax.com
- Website: https://equitastax.com

## 🏢 About Equitas Tax

Equitas Tax Service LLC provides professional tax filing services with a focus on security, accuracy, and customer satisfaction.

---

**Built with ❤️ by the Equitas Tax Team** 