import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { SearchListingPage } from './pages/SearchListingPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { fetchUser } from './redux/slices/authSlice';

function AppRoutes() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is already logged in (session exists)
    dispatch(fetchUser() as any);
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/search" element={<SearchListingPage />} />
      <Route path="/videos/:id" element={<VideoDetailPage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;