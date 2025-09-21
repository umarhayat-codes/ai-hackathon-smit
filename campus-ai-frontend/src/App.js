import React from 'react';
import "./App.scss";
import Route from './pages/Routes'
import { useAuthContext } from './context/AuthContext';
import Loader from './components/loader/Loader'
function App() {
  const {isAppLoading} = useAuthContext()
  if (isAppLoading) {    
    return <div className="flex-center min-vh-100"><Loader /></div>
        
  }
  return (
    <>
      <Route/>
    </>
  );
}

export default App;
