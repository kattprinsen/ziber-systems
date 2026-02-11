# Quick Start Guide - Ziber Systems

## 🚀 Getting Started in 3 Minutes

### Step 1: Install Dependencies

**Frontend:**
```powershell
npm install
```

**Backend:**
```powershell
cd backend
npm install
cd ..
```

### Step 2: Start the Servers

**Option A: Two Separate Terminals (Recommended)**

Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```
You should see: `🚀 Server is running on http://localhost:3001`

Terminal 2 - Frontend:
```powershell
npm run dev
```
You should see: `Local: http://localhost:5173/`

**Option B: Background Processes (PowerShell)**
```powershell
# Start backend in new window
cd backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start frontend in new window
cd ..
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
```

### Step 3: Open the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📋 What You'll See

1. **Home Page** - Two-column layout with dark theme
2. **Users Page** - Grid of user cards with:
   - Search functionality
   - Department filtering
   - Status filtering
3. **User Detail Page** - Click any user card to see:
   - Full profile information
   - Contact details
   - Skills and expertise

## 🔧 Environment Variables

The `.env` files are already created with default values:

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend `backend/.env`** (create if needed):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## 🧪 Testing the API

Once the backend is running, test these endpoints:

**Health Check:**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/health -UseBasicParsing
```

**Get All Users:**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/users -UseBasicParsing
```

**Get Specific User:**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/users/user-001 -UseBasicParsing
```

**Search Users:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/users?search=emma" -UseBasicParsing
```

## 🎯 Key Features to Try

1. **Navigate to Users** - Click "Users" in the navbar
2. **Search** - Type in the search box (try "Emma" or "Engineer")
3. **Filter** - Use the department or status dropdowns
4. **View Details** - Click any user card
5. **Navigate Back** - Use the back button or navbar

## 📁 User Data

User data is stored in:
```
backend/src/data/users.json
```

To add or modify users, edit this file and the backend will automatically reload (when using `npm run dev`).

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 3001 is already in use
- Run `cd backend; npm install` again
- Check for errors in terminal output

**Frontend can't connect to backend:**
- Verify backend is running on port 3001
- Check `.env` file has correct `VITE_API_URL`
- Restart the frontend dev server after changing `.env`

**Changes not showing:**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Restart dev servers
- Check browser console for errors (F12)

## 📚 Next Steps

- Add more users to `backend/src/data/users.json`
- Customize the dark theme colors in `tailwind.config.js`
- Create new pages and add routes in `src/main.tsx`
- Add new API endpoints in `backend/src/routes/`
- Implement user authentication
- Add user editing capabilities

## 🔗 Useful Links

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- API Health: http://localhost:3001/api/health
- Users API: http://localhost:3001/api/users
