import './App.css'
import Login from './pages/Login'
import Dashborad from './pages/Dashborad'
import { Routes , Route, Navigate } from "react-router"
import PageNotFound from './pages/PageNotFound'
function App() {

  const isLoggedIn = false;

  return (
    <div>

     <Routes>
       <Route path="/login" element={<Login />} />
       <Route path="/" element={isLoggedIn ? <Dashborad /> : <Navigate to="/login" replace />} />
       <Route path="*" element={<PageNotFound />} />
     </Routes>
    </div>
  )
}

export default App
