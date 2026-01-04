import { Link, useLocation, useNavigate } from "react-router-dom";
import { Waves, History, Sun, Moon, Scan, User, LogOut, Home } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const isActive = (path) => location.pathname === path;
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 text-primary hover:opacity-80 transition-all group"
              data-testid="logo-link"
            >
              <div className="relative">
                <Waves className="h-7 w-7 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">NutriDive</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link to="/">
                <Button variant={isActive("/") ? "default" : "ghost"} size="sm" className="rounded-full" data-testid="nav-home">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              {user && (
                <>
                  <Link to="/scan">
                    <Button variant={isActive("/scan") ? "default" : "ghost"} size="sm" className="rounded-full" data-testid="nav-scan">
                      <Scan className="h-4 w-4 mr-2" />
                      Scan
                    </Button>
                  </Link>
                  <Link to="/history">
                    <Button variant={isActive("/history") ? "default" : "ghost"} size="sm" className="rounded-full" data-testid="nav-history">
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Button>
                  </Link>
                </>
              )}
              
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full" data-testid="theme-toggle">
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative" data-testid="user-menu">
                      <User className="h-5 w-5" />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")} data-testid="profile-link">
                      <User className="mr-2 h-4 w-4" />
                      Profile & Allergens
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button variant="default" size="sm" className="rounded-full" data-testid="login-btn">
                    Login
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-primary" />
              NutriDive - Dive Deep Into Your Food
            </p>
            <p>Powered by Open Food Facts & AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
