
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TabProps {
  label: string;
  value: string;
  children: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ label, value, children }) => {
  return <>{children}</>;
};

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> & { Tab: typeof Tab } = ({ defaultValue, className, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Extract tabs from children
  const tabs = React.Children.toArray(children) as React.ReactElement<TabProps>[];
  
  const handleTabClick = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md mb-4 shadow-sm">
        <div className="flex flex-nowrap min-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.props.value}
              className={cn(
                "py-1.5 md:py-2 px-2 md:px-3 transition-colors font-medium text-[10px] md:text-sm whitespace-nowrap flex-shrink-0",
                activeTab === tab.props.value
                  ? "bg-gift-primary dark:bg-gift-primary text-white"
                  : "hover:bg-gift-primary/10 dark:hover:bg-gift-primary/20 hover:text-gift-primary dark:hover:text-white"
              )}
              onClick={() => handleTabClick(tab.props.value)}
            >
              {tab.props.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2 md:p-4 shadow-sm">
        {tabs.find((tab) => tab.props.value === activeTab)?.props.children}
      </div>
    </div>
  );
};

Tabs.Tab = Tab;

export default Tabs;
