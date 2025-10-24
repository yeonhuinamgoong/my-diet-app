import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode, icon?: React.ReactNode, className?: string }> = ({ children, icon, className }) => (
    <div className={`p-4 border-b border-slate-200 flex items-center space-x-3 ${className}`}>
        {icon}
        <h2 className="text-lg font-bold text-slate-800">{children}</h2>
    </div>
);

export const CardContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`p-4 ${className}`}>
        {children}
    </div>
);

export default Card;