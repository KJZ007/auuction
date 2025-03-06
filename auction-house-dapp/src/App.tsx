import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import { useState } from 'react';

const App: React.FC = () => {
  const [connectedAccount, setConnectedAccount] = useState<string>('');

  const handleConnect = (account: string) => {
    setConnectedAccount(account);
    console.log('Connected account:', account);
  };

  const handleLogout = () => {
    setConnectedAccount('');
  };

  return (
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage onConnect={handleConnect} />} />
          <Route 
            path="/dashboard" 
            element={
              connectedAccount ? (
                <UserDashboard 
                  account={connectedAccount} 
                  onLogout={handleLogout} 
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
};

export default App; 