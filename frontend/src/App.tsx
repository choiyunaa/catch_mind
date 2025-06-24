import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import RoomPage from './pages/RoomPage';
import LookDrawPage from './pages/LookDrawPage';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/lookdraw/:roomId" element={<LookDrawPage />} />
      </Routes>
    </Router>
  );
};

export default App;
