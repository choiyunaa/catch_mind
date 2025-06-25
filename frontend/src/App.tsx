import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import RoomPage from './pages/RoomPage';
<<<<<<< HEAD
import GalleryPage from './pages/GalleryPage';
import GalleryDetailPage from './pages/GalleryDetail';
import GalleryWrite from './pages/GalleryWrite';
import MyPage from './pages/MyPage';
=======
import LookDrawPage from './pages/LookDrawPage';

>>>>>>> d2bd67526c98b00023d89f9e9dee67e7a6775860

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
<<<<<<< HEAD
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:id" element={<GalleryDetailPage />} />
        <Route path="/gallery/write" element={<GalleryWrite />} />  
        <Route path="/gallery/mypage" element={<MyPage />} />
=======
        <Route path="/lookdraw/:roomId" element={<LookDrawPage />} />
>>>>>>> d2bd67526c98b00023d89f9e9dee67e7a6775860
      </Routes>
    </Router>
  );
};

export default App;
