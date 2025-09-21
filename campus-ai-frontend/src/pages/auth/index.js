import React from 'react'
import { Route, Routes } from 'react-router-dom'

import ForgetPassword from './ForgetPassword'
import Register from './Register'
import Login from './Login'

export default function Auth() {
  return (
    <>
    <Routes>
        <Route path='login' element={<Login/>} />    
        <Route path='register' element={<Register/>} />    
        <Route path='forget-pasword' element={<ForgetPassword/>} /> 
        <Route path='*' element={<h1 className='text-center'>Page Not Found. 404 Error</h1>} />    

    </Routes> 
    </>
  )
}
