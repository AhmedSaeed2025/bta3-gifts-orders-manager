
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveTableProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  id, 
  className = "" 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="responsive-table-container">
      <table 
        id={id}
        className={`responsive-table gift-table ${className} ${isMobile ? 'mobile-text-xs' : ''}`}
      >
        {children}
      </table>
    </div>
  );
};

export const ResponsiveTableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <thead>{children}</thead>;
};

export const ResponsiveTableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <tbody>{children}</tbody>;
};

export const ResponsiveTableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => {
  return <tr className={className}>{children}</tr>;
};

export const ResponsiveTableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => {
  return <th className={className}>{children}</th>;
};

export const ResponsiveTableCell: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  colSpan?: number;
  title?: string;
}> = ({ 
  children, 
  className = "",
  colSpan,
  title
}) => {
  return <td className={className} colSpan={colSpan} title={title}>{children}</td>;
};
