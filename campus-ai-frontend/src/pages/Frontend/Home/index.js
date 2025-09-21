import React from 'react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { useAuthContext } from '../../../context/AuthContext';
import { Button } from 'antd';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuthContext();
  console.log('isAuthenticated', isAuthenticated)
  console.log('user in home page', user)

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <Header/>
      <main className='container'>
        <div className="row">
          <div className="col">
            <h1>Welcome, {user?.firstName}</h1>
            <p>Email: {user?.email}</p>

            <Button type="primary" danger onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </main>
      <Footer/> 
    </>
  )
}
