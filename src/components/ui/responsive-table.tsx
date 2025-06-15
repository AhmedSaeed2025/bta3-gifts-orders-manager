
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
    <div className={`responsive-table-container ${isMobile ? 'overflow-x-auto -mx-2 px-2' : 'overflow-x-auto'}`}>
      <table 
        id={id}
        className={`responsive-table gift-table w-full ${className} ${
          isMobile 
            ? 'text-xs mobile-warm-table border-collapse mobile-warm-border border' 
            : ''
        }`}
      >
        {children}
      </table>
    </div>
  );
};

export const ResponsiveTableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  return (
    <thead className={isMobile ? 'mobile-warm-table-header' : ''}>
      {children}
    </thead>
  );
};

export const ResponsiveTableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <tbody>{children}</tbody>;
};

export const ResponsiveTableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => {
  const isMobile = useIsMobile();
  return (
    <tr className={`${className} ${isMobile ? 'mobile-warm-table-row border-b mobile-warm-border' : ''}`}>
      {children}
    </tr>
  );
};

export const ResponsiveTableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => {
  const isMobile = useIsMobile();
  return (
    <th className={`${className} ${isMobile ? 'p-2 text-xs font-medium mobile-warm-text border-r mobile-warm-border last:border-r-0' : 'p-4'}`}>
      {children}
    </th>
  );
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
  const isMobile = useIsMobile();
  return (
    <td 
      className={`${className} ${isMobile ? 'p-2 text-xs border-r mobile-warm-border last:border-r-0' : 'p-4'}`} 
      colSpan={colSpan} 
      title={title}
    >
      {children}
    </td>
  );
};
