// src/App.js
import React from 'react';
import './App.css';
import Calculator from './components/Calculator'; // Update this path
import AuthBar from './components/AuthBar';
import { AuthProvider } from './lib/AuthContext';
import { FavoritesProvider } from './lib/FavoritesContext';

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <div className="App">
          <header className="app-header">
            <AuthBar />
          </header>
          <Calculator />
        </div>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;