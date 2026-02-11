# Ziber Systems - Full Stack Application

A modern full-stack React application with Node.js backend featuring a professionally designed dark-themed interface, user management system, and RESTful API.

## Features

### Frontend
- ✨ **Dark Theme**: WCAG AA compliant dark color scheme with excellent contrast ratios
- 📱 **Responsive Design**: Mobile-first layout that adapts to all screen sizes
- 🎨 **Orange Accents**: Vibrant orange (#FF6B35) accent color for interactive elements
- 👥 **User Management**: Browse, search, and view detailed user profiles
- 🔍 **Advanced Filtering**: Filter users by department, status, or search query
- ♿ **Accessible**: Keyboard navigation, focus states, and screen reader support
- ⚡ **Fast**: Built with Vite for lightning-fast development
- 🎯 **TypeScript**: Full type safety across all components

### Backend
- 🚀 **RESTful API**: Express.js with TypeScript
- 📊 **User Data Management**: JSON-based data storage with caching
- 🛡️ **Security**: Helmet.js for security headers, CORS configuration
- 📝 **Request Logging**: Custom middleware for request tracking
- ⚠️ **Error Handling**: Centralized error handling with proper status codes
- 🔧 **Best Practices**: Service layer architecture, async/await patterns

## Tech Stack

### Frontend
- **React 19.2.0** - UI framework with React Router for navigation
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first styling

### Backend
- **Node.js** - Runtime environment
- **Express 4.18** - Web framework
- **TypeScript 5.3** - Type safety
- **tsx** - TypeScript execution for development
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## Project Structure

```
ziber-systems/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── data/          # JSON data files (users.json)
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic layer
│   │   ├── types/         # TypeScript types
│   │   └── server.ts      # Express app setup
│   ├── package.json
│   └── tsconfig.json
│
├── src/                    # React frontend
│   ├── components/
│   │   ├── layout/        # Layout components (Navbar, Layout, etc.)
│   │   └── users/         # User-related components (UserCard)
│   ├── pages/             # Page components
│   │   ├── UsersPage/     # Users listing page
│   │   ├── UserDetailPage/# Individual user details
│   │   ├── ToolsPage/
│   │   └── ErrorPage/
│   ├── services/          # API client and services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── package.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+ or yarn 1.22+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ziber-systems
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure Environment Variables**
   
   Frontend - Create `.env` in root:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

   Backend - Create `backend/.env`:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

### Running the Application

**Option 1: Run Both Servers Separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

**Option 2: Run Both Servers in Background (PowerShell)**

```powershell
# Start backend
cd backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start frontend
cd ..
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`

### Building for Production

**Frontend:**
```bash
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health check

### Users
- `GET /api/users` - Get all users
  - Query params:
    - `department` - Filter by department (e.g., "Engineering")
    - `status` - Filter by status (active, inactive, on-leave)
    - `search` - Search by name, email, role, or department
- `GET /api/users/:id` - Get user by ID

**Example Requests:**
```bash
# Get all users
curl http://localhost:3001/api/users

# Filter by department
curl http://localhost:3001/api/users?department=Engineering

# Search users
curl http://localhost:3001/api/users?search=emma

# Get specific user
curl http://localhost:3001/api/users/user-001
```

## Features Overview

### User Management
- **Browse Users**: View all team members in a responsive card grid
- **Search**: Real-time search across names, emails, roles, and departments
- **Filter**: Filter users by department or employment status
- **User Details**: Click any user card to view comprehensive profile information
- **Status Indicators**: Visual badges showing user status (Active, Inactive, On Leave)

### Data Structure
Users are stored in `backend/src/data/users.json` with the following structure:
```json
{
  "id": "unique-id",
  "name": "Full Name",
  "email": "email@example.com",
  "role": "Job Title",
  "department": "Department Name",
  "avatar": "image-url",
  "phone": "+46 70 123 4567",
  "joinedDate": "2023-03-15",
  "status": "active",
  "bio": "User biography",
  "skills": ["Skill 1", "Skill 2"],
  "location": "City, Country"
}
```

## Development

### Frontend Scripts

```tsx
import { Navbar } from './components/layout';
import { NavLink } from './types/layout';

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
];

<Navbar links={navLinks} logo={<YourLogo />} />
```

### Two-Column Layout

```tsx
import { TwoColumnLayout, Column } from './components/layout';

<TwoColumnLayout
  leftColumn={
    <Column spacing="lg" border>
      <h2>Left Content</h2>
    </Column>
  }
  rightColumn={
    <Column spacing="lg" border>
      <h2>Right Content</h2>
    </Column>
  }
  gap="lg"
  columnRatio="1:1"
/>
```

### Button

```tsx
import { Button } from './components/layout';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>
```

## Color Palette

```javascript
colors: {
  dark: {
    bg: '#0f0f0f',        // Main background
    surface: '#1a1a1a',   // Elevated surfaces
    border: '#2a2a2a',    // Borders
  },
  orange: {
    accent: '#FF6B35',    // Primary accent
    hover: '#FF8B5A',     // Hover states
    active: '#E55525',    // Active states
  },
  text: {
    primary: '#f5f5f5',   // Main text
    secondary: '#a0a0a0', // Secondary text
    muted: '#6b6b6b',     // Muted text
  },
}
```

## Project Structure

```
src/
├── components/
│   └── layout/
│       ├── Navbar.tsx           # Navigation bar
│       ├── TwoColumnLayout.tsx  # Two-column layout
│       ├── Column.tsx           # Column wrapper
│       ├── Button.tsx           # Button component
│       └── index.ts             # Barrel exports
├── types/
│   └── layout.ts                # TypeScript interfaces
├── utils/
│   └── constants.ts             # Theme constants
├── App.tsx                      # Main app
└── main.tsx                     # Entry point
```

## Accessibility

- All text meets WCAG AA contrast ratios (4.5:1 minimum)
- Keyboard navigation fully supported
- Focus indicators with orange accent rings
- ARIA labels on interactive elements
- Responsive design supports 320px-2560px viewports

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Documentation

For detailed implementation guides, see:
- [Quickstart Guide](./specs/001-dark-ui-layout/quickstart.md)
- [Component Interfaces](./specs/001-dark-ui-layout/contracts/component-interfaces.md)
- [Data Model](./specs/001-dark-ui-layout/data-model.md)

## License

MIT
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
