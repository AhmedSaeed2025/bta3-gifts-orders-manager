
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
      <div className="overflow-hidden border border-gray-300 bg-white rounded-md mb-4">
        <div className="flex flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.props.value}
              className={cn(
                "py-3 px-4 transition-colors font-medium",
                activeTab === tab.props.value
                  ? "bg-gift-primary text-white"
                  : "hover:bg-gift-primary hover:text-white"
              )}
              onClick={() => handleTabClick(tab.props.value)}
            >
              {tab.props.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border border-gray-300 bg-white rounded-md p-4">
        {tabs.find((tab) => tab.props.value === activeTab)?.props.children}
      </div>
    </div>
  );
};

Tabs.Tab = Tab;

export default Tabs;
