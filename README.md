# TaskBoard - MERN Stack Project Management System

A modern, full-stack task management system built with the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Features

- **JWT Authentication** - Secure user authentication with JSON Web Tokens
- **Role-Based Access Control** - Four user roles (Requester, Department Head, Developer, Tech Admin)
- **Project Management** - Create and manage projects with status tracking
- **Page Workflow** - Page approval workflow with ticket limits
- **Ticket System** - Issue tracking with categories, priorities, and status management
- **Notifications** - Real-time user notifications
- **MongoDB Integration** - Cloud database with MongoDB Atlas

## 📁 Project Structure

```
modern-mern-hub/
├── backend/          # Express.js API server
├── frontend/         # React + Vite application
└── package.json      # Root package for concurrent dev
```

## 🛠️ Tech Stack

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database (MongoDB Atlas)
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **TypeScript** - Type safety

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **React Router** - Routing
- **Shadcn/ui** - UI components
- **Tailwind CSS** - Styling

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install              # Root
cd backend && npm install
cd frontend && npm install
```


### Running the Application

**Development Mode (Recommended):**
```bash
# Run both frontend and backend concurrently
npm run dev
```

**Separate Terminals:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Pages
- `GET /api/pages` - Get all pages
- `POST /api/pages` - Create page
- `PUT /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Delete page

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)

## 👥 User Roles

1. **Requester** - Can view projects, request pages, and raise tickets (up to 2 per page)
2. **Department Head** - Can approve/reject pages and unlock pages after ticket limit
3. **Developer** - Can update page status and resolve tickets
4. **Tech Admin** - Full access to all features and user management

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control on API routes
- Protected routes with middleware
- CORS configuration for cross-origin requests

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using the MERN stack
