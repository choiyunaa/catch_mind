import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import RoomPage from './pages/RoomPage';
import GalleryPage from './pages/GalleryPage';
import GalleryDetailPage from './pages/GalleryDetail';
import GalleryWrite from './pages/GalleryWrite';
import MyPage from './pages/MyPage';
import LookDrawPage from './pages/LookDrawPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:id" element={<GalleryDetailPage />} />
        <Route path="/gallery/write" element={<GalleryWrite />} />
        <Route path="/gallery/mypage" element={<MyPage />} />
        <Route path="/lookdraw/:roomId" element={<LookDrawPage />} />
      </Routes>
    </Router>
  );
};

export default App;
