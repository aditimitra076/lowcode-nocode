import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// page import
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import AuthPage from './pages/AuthPage.jsx'

// importing browser router
import {createBrowserRouter , RouterProvider} from "react-router-dom"

// creating browser router in array style

const router = createBrowserRouter([
  {
    path: "/" , element : <Home/> , errorElement : <NotFound/>
  } , 
  {
    path:"/auth/:type" , element:<AuthPage/>
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}>
      <App />
    </RouterProvider>
    
  </StrictMode>,
)
