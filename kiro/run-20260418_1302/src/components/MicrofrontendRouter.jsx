import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDynamicComponent } from '../hooks/useDynamicComponent';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

const MicrofrontendRoute = ({ 
  path, 
  remoteName, 
  componentName, 
  fallback,
  ...props 
}) => {
  const { Component, loading, error, retry } = useDynamicComponent(
    remoteName, 
    componentName,
    { fallback }
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !Component) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          Failed to load {componentName}
        </div>
        <button 
          onClick={retry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return Component ? <Component {...props} /> : null;
};

const MicrofrontendRouter = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Task Management Routes */}
          <Route 
            path="/tasks" 
            element={
              <MicrofrontendRoute 
                remoteName="taskMfe" 
                componentName="TaskList" 
              />
            } 
          />
          <Route 
            path="/tasks/new" 
            element={
              <MicrofrontendRoute 
                remoteName="taskMfe" 
                componentName="TaskForm" 
              />
            } 
          />
          <Route 
            path="/tasks/:id" 
            element={
              <MicrofrontendRoute 
                remoteName="taskMfe" 
                componentName="TaskDetail" 
              />
            } 
          />
          <Route 
            path="/tasks/:id/edit" 
            element={
              <MicrofrontendRoute 
                remoteName="taskMfe" 
                componentName="TaskForm" 
              />
            } 
          />
          <Route 
            path="/board" 
            element={
              <MicrofrontendRoute 
                remoteName="taskMfe" 
                componentName="TaskBoard" 
              />
            } 
          />

          {/* Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <MicrofrontendRoute 
                remoteName="dashboardMfe" 
                componentName="Dashboard" 
              />
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <MicrofrontendRoute 
                remoteName="dashboardMfe" 
                componentName="Analytics" 
              />
            } 
          />
          <Route 
            path="/reports" 
            element={
              <MicrofrontendRoute 
                remoteName="dashboardMfe" 
                componentName="Reports" 
              />
            } 
          />

          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={
              <MicrofrontendRoute 
                remoteName="authMfe" 
                componentName="Login" 
              />
            } 
          />
          <Route 
            path="/register" 
            element={
              <MicrofrontendRoute 
                remoteName="authMfe" 
                componentName="Register" 
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <MicrofrontendRoute 
                remoteName="authMfe" 
                componentName="Profile" 
              />
            } 
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch-all Route */}
          <Route 
            path="*" 
            element={
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Page Not Found
                </h2>
                <p className="text-gray-600">
                  The requested page could not be found.
                </p>
              </div>
            } 
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default MicrofrontendRouter;