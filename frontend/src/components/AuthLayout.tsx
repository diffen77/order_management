import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Orderhanteringssystem
          </h1>
          <p className="text-sm text-muted-foreground">
            Hantera dina beställningar enkelt och effektivt
          </p>
        </div>
        <div className="bg-card p-8 shadow-md rounded-lg">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 