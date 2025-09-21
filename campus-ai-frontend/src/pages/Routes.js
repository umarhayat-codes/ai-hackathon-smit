import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
// import Auth from './Auth'
import Frontend from './Frontend'
import Auth from './auth'
import { useAuthContext } from '../context/AuthContext'

export default function Index() {

  const {isAuthenticated}=useAuthContext()
  return (
    <>
    <Routes>
        <Route path='/*' element={isAuthenticated ? <Frontend/> : <Navigate to='/auth/login' />} />

        <Route path='auth/*' element={!isAuthenticated ? <Auth/> : <Navigate to='/' />} />

    </Routes> 
    </>
  )
}


// import React from 'react'
// import { Navigate, Route, Routes } from 'react-router-dom'
// import Frontend from './Frontend'
// import Auth from './auth'
// import { useAuthContext } from '../context/AuthContext'

// export default function Index() {
//   const { isAuthenticated, isAppLoading } = useAuthContext();

//   if (isAppLoading) {
//     return <p>Loading...</p>; // or a spinner
//   }

//   return (
//     <Routes>
//       {/* <Route 
//         path="/*" 
//         element={isAuthenticated ? <Frontend/> : <Navigate to="/auth/login" />} 
//       /> */}

//       <Route 
//         path="/*" 
//         element={<Frontend/>} 
//       />

//       {/* <Route 
//         path="auth/*" 
//         element={!isAuthenticated ? <Auth/> : <Navigate to="/" />} 
//       /> */}
//     </Routes>
//   )
// }
