# 🚀 ZenAI Frontend

Modern React-based frontend for the ZenAI AI-powered project management platform.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Components](#components)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Best Practices](#best-practices)

## ✨ Features

- 🎨 Modern, responsive UI with TailwindCSS
- 🤖 AI-powered task generation and project analysis
- 📊 Interactive dashboards with real-time data
- 🎯 Kanban board for task management
- 💬 AI chat interface for natural language interactions
- 🎙️ Meeting transcription with AI summaries
- 🔐 Secure JWT-based authentication
- 🌙 Dark mode support (optional)
- 📱 Mobile-responsive design
- ⚡ Fast performance with Vite

## 🛠 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State Management**: React Context API + Custom Hooks
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns
- **Drag & Drop**: react-beautiful-dnd
- **Charts**: Recharts

## 📁 Project Structure

```
zenai-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── layout/          # Layout components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── projects/        # Project management
│   │   ├── tasks/           # Task management
│   │   └── ai/              # AI-powered features
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services
│   ├── utils/               # Utility functions
│   ├── styles/              # Global styles
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # App entry point
│   └── routes.jsx           # Route definitions
├── .env.example             # Environment variables template
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.x
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zenai-production/zenai-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

5. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |

## 🧩 Components

### Common Components

- **Button**: Customizable button with variants and loading states
- **Input**: Form input with validation support
- **Modal**: Accessible modal dialog
- **Card**: Container component for content
- **Loading**: Loading spinner
- **Toast**: Notification component

### Layout Components

- **Navbar**: Top navigation bar
- **Sidebar**: Collapsible sidebar navigation
- **Footer**: Page footer

### Feature Components

- **Dashboard**: Project overview and statistics
- **ProjectList**: Grid/list view of projects
- **TaskList**: Task list with filtering
- **KanbanBoard**: Drag-and-drop task board
- **AIChat**: Chat interface with AI assistant
- **TaskGenerator**: AI-powered task creation
- **MeetingTranscriber**: Audio transcription tool

## 🗂 State Management

### Contexts

- **AuthContext**: User authentication state
- **ThemeContext**: Theme preferences
- **NotificationContext**: App-wide notifications

### Custom Hooks

- **useAuth**: Authentication operations
- **useProjects**: Project CRUD operations
- **useTasks**: Task management
- **useAI**: AI-powered features

## 🌐 API Integration

All API calls go through the centralized `api.js` service with:

- Automatic token refresh
- Request/response interceptors
- Error handling
- Toast notifications

### Service Files

- `auth.service.js` - Authentication endpoints
- `project.service.js` - Project management
- `task.service.js` - Task operations
- `ai.service.js` - AI-powered features

## 🎨 Styling

### TailwindCSS

The project uses TailwindCSS for styling with a custom configuration:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: { /* custom primary colors */ },
      secondary: { /* custom secondary colors */ }
    }
  }
}
```

### Component Styling

- Utility-first approach with TailwindCSS
- Consistent spacing and sizing
- Responsive design patterns
- Accessible color contrast

## 📚 Best Practices

### Code Organization

- Keep components small and focused
- Use custom hooks for logic reuse
- Separate business logic from UI
- Follow consistent naming conventions

### Performance

- Use React.memo for expensive components
- Lazy load routes and components
- Optimize images and assets
- Debounce search inputs

### Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management in modals

### Security

- Sanitize user inputs
- Validate data on both client and server
- Store tokens securely
- Implement CSRF protection

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For issues and questions, please contact the development team.
