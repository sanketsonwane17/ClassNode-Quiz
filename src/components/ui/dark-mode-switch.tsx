
import React from 'react';
import { Switch } from './switch';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const DarkModeSwitch: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isDarkMode ? "text-muted-foreground scale-90" : "text-yellow-500 scale-100"
      )}>
        <Sun className="h-4 w-4" />
      </div>
      
      <div className="relative">
        <Switch
          checked={isDarkMode}
          onCheckedChange={toggleDarkMode}
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            "data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-yellow-100",
            "border-2 border-transparent",
            "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            "shadow-lg hover:shadow-xl"
          )}
        />
        
        {/* Animated icons inside the switch */}
        <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isDarkMode ? "opacity-0 scale-50 rotate-180" : "opacity-70 scale-75 rotate-0"
          )}>
            <Sun className="h-3 w-3 text-yellow-600" />
          </div>
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isDarkMode ? "opacity-70 scale-75 rotate-0" : "opacity-0 scale-50 -rotate-180"
          )}>
            <Moon className="h-3 w-3 text-blue-200" />
          </div>
        </div>
      </div>
      
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isDarkMode ? "text-blue-400 scale-100" : "text-muted-foreground scale-90"
      )}>
        <Moon className="h-4 w-4" />
      </div>
    </div>
  );
};

export default DarkModeSwitch;
