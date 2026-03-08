import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
      aria-label="Basculer le thème"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-accent transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-4 w-4 text-primary transition-transform duration-300 rotate-0" />
      )}
    </Button>
  );
};

export default ThemeToggle;
