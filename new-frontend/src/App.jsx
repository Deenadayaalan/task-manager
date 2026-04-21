import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ToastContainer';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Board from './components/Board';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskDetail from './components/TaskDetail';

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="board" element={<Board />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/new" element={<TaskForm />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="tasks/:id/edit" element={<TaskForm />} />
          </Route>
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
