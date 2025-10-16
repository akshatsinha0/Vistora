import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { TaskList } from './components/TaskList';
import { Task } from './types';

const TaskListWithWebSocket: React.FC = () => {
  const handleTaskCreated = (task: Task) => {
    console.log('Task created:', task);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    console.log('Task updated:', updatedTask);
  };

  const handleTaskDeleted = (taskId: string) => {
    console.log('Task deleted:', taskId);
  };

  return (
    <WebSocketProvider
      onTaskCreated={handleTaskCreated}
      onTaskUpdated={handleTaskUpdated}
      onTaskDeleted={handleTaskDeleted}
    >
      <TaskList />
    </WebSocketProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TaskListWithWebSocket />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
