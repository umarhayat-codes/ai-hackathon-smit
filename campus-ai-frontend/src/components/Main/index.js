import React from 'react'
import { json } from 'react-router-dom'

export default function Main() {
    let user = json.parse(localStorage.getItem("register"))

  return (
    <div className='py-5'>
      <div className="container">
        <div className="row">
            <div className="col">
                <h1 className='text-center'>Welcome to {user.fullName}</h1>
            </div>
        </div>
      </div>
    </div>
  )
}
