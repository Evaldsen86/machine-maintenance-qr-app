import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  Home, 
  QrCode, 
  Settings, 
  LogOut, 
  User,
  UserCog,
  FilePlus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import QRScanner from './QRScanner';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, canManageUsers } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  const [canOpenQR, setCanOpenQR] = useState(true);
  
  const handleOpenQRScanner = () => {
    if (!canOpenQR) return;
    
    setShowQRScanner(true);
    setCanOpenQR(false);
    
    setTimeout(() => {
      setCanOpenQR(true);
    }, 1500);
  };
  
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      try {
        const storedMachines = localStorage.getItem('dashboard_machines');
        if (storedMachines) {
          const machines = JSON.parse(storedMachines);
          console.log(`Dashboard loaded with ${machines.length} machines`);
        }
      } catch (error) {
        console.error("Error checking machines on dashboard:", error);
      }
    }
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Åbn menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Maskine QR System</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-4">
                  <SheetClose asChild>
                    <Link 
                      to="/dashboard" 
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                        isActive('/dashboard') 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <Home className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <button
                      onClick={handleOpenQRScanner}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary text-left"
                    >
                      <QrCode className="h-4 w-4" />
                      Scan QR-kode
                    </button>
                  </SheetClose>
                  {isAuthenticated && user?.role === 'admin' && (
                    <>
                      <SheetClose asChild>
                        <Link 
                          to="/add-machine" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                            isActive('/add-machine') 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-secondary'
                          }`}
                        >
                          <FilePlus className="h-4 w-4" />
                          Tilføj maskine
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link 
                          to="/settings" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                            isActive('/settings') 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-secondary'
                          }`}
                        >
                          <Settings className="h-4 w-4" />
                          Indstillinger
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link 
                          to="/user-management" 
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                            isActive('/user-management') 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-secondary'
                          }`}
                        >
                          <UserCog className="h-4 w-4" />
                          Brugere
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link to="/" className="flex items-center space-x-2">
              <Settings className="h-6 w-6" />
              <span className="inline-block font-bold">Maskine QR System</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-5">
            {isAuthenticated && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleOpenQRScanner}
                  className="flex items-center gap-1"
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  Scan QR
                </Button>
                {user && user.role === 'admin' && (
                  <>
                    <Link 
                      to="/add-machine" 
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive('/add-machine') ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <FilePlus className="h-4 w-4 mr-1" />
                        Tilføj maskine
                      </div>
                    </Link>
                    <Link 
                      to="/settings" 
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive('/settings') ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Indstillinger
                      </div>
                    </Link>
                    <Link 
                      to="/user-management" 
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive('/user-management') ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <UserCog className="h-4 w-4 mr-1" />
                        Brugere
                      </div>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
          
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImage || ""} alt={user?.name} />
                      <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log ud</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate('/')}>
                Log ind
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {showQRScanner && (
        <QRScanner onClose={() => setShowQRScanner(false)} />
      )}
    </>
  );
};

export default Navbar;
