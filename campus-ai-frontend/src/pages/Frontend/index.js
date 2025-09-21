import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Todo from './Todo'
import Home from './Home'
import StudentChatBot from './chatbot/StudentChatBot'
import User from './chatbot/User'

export default function Frontend() {
  return (
    <>
    <Routes>
        <Route path='bot' element={<StudentChatBot/>} />
        <Route path='home' element={<Home/>} />
        <Route path='/' element={<User/>} />
        <Route path='todo' element={<Todo/>} />
        <Route path='*' element={<h1 className='text-center'>Page Not found. 404 Error</h1>} />
    </Routes> 
    </>
  )
}
