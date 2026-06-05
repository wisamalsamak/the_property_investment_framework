// src/App.js
import React from 'react';
import './App.css';
import Calculator from './components/Calculator'; // Update this path
import AuthBar from './components/AuthBar';
import { AuthProvider } from './lib/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <header className="app-header">
          <AuthBar />
        </header>
        <Calculator />
      </div>
    </AuthProvider>
  );
}

export default App;