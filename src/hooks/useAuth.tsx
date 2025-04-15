import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isPublicAccess: boolean;
  setPublicAccess: (value: boolean) => void;
  hasPermission: (role: UserRole) => boolean;
  canEditMachine: (machineEditPermissions?: UserRole[]) => boolean;
  canAddServiceRecord: () => boolean;
  canMarkLubrication: () => boolean;
  canAddNotes: () => boolean;
  canUploadDocuments: () => boolean;
  canManageUsers: () => boolean;
  canAddTask: () => boolean;
  updateUserProfile: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPublicAccess, setIsPublicAccess] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Fejl ved læsning af brugerdata fra localStorage:', error);
        localStorage.removeItem('user');
      }
    }

    const checkQrAccess = () => {
      const url = new URL(window.location.href);
      const hasQrParam = url.searchParams.has('qr');
      const hasMachineParam = url.pathname.includes('/machine/');
      
      if (hasQrParam || (hasMachineParam && !storedUser)) {
        console.log("Setting public access mode from useAuth effect. QR param:", hasQrParam, "Machine path:", hasMachineParam);
        setIsPublicAccess(true);
      }
    };
    
    checkQrAccess();
    
    const handleUrlChange = () => {
      checkQrAccess();
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (email === 'mje@transport.gl' && password === 'Salikme010623!') {
        const adminUser: User = {
          id: 'admin-1',
          name: 'Admin',
          role: 'admin',
          email: 'mje@transport.gl',
          profileImage: null
        };
        setUser(adminUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(adminUser));
        toast({
          title: "Logget ind",
          description: `Velkommen, ${adminUser.name}!`,
        });
        return true;
      }
      
      const foundUser = getUserByEmailAndPassword(email, password);
      
      if (foundUser) {
        setUser(foundUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(foundUser));
        toast({
          title: "Logget ind",
          description: `Velkommen, ${foundUser.name}!`,
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Fejl ved login",
          description: "Ugyldige loginoplysninger. Prøv igen.",
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fejl ved login",
        description: "Der opstod en fejl. Prøv igen senere.",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsPublicAccess(false);
    localStorage.removeItem('user');
    toast({
      title: "Logget ud",
      description: "Du er nu logget ud af systemet.",
    });
  };

  const getUserByEmailAndPassword = (email: string, password: string): User | null => {
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      return {
        ...user,
        profileImage: user.profileImage || null
      };
    }
    
    return null;
  };

  const hasPermission = (minRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'viewer': 1,
      'customer': 1,
      'driver': 2,
      'mechanic': 3,
      'technician': 4,
      'blacksmith': 4,
      'admin': 5,
      'guest': 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[minRole];
  };

  const canManageUsers = () => {
    return user?.role === 'admin';
  };

  const canAddMachine = () => {
    return user?.role === 'admin' || user?.role === 'mechanic';
  };

  const canEditMachine = (machineEditPermissions?: UserRole[]) => {
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    if (machineEditPermissions && machineEditPermissions.includes(user.role)) {
      return true;
    }
    
    return false;
  };

  const canAddServiceRecord = (): boolean => {
    return isAuthenticated && (hasPermission('mechanic') || hasPermission('technician') || hasPermission('blacksmith'));
  };

  const canMarkLubrication = (): boolean => {
    return isAuthenticated && (hasPermission('driver') || hasPermission('mechanic') || hasPermission('technician') || hasPermission('blacksmith'));
  };

  const canAddNotes = (): boolean => {
    return isAuthenticated && (hasPermission('driver') || hasPermission('mechanic') || hasPermission('technician') || hasPermission('blacksmith'));
  };

  const canUploadDocuments = (): boolean => {
    return isAuthenticated && (hasPermission('mechanic') || hasPermission('technician') || hasPermission('blacksmith') || hasPermission('admin'));
  };

  const canAddTask = (): boolean => {
    return isAuthenticated && (hasPermission('mechanic') || hasPermission('technician') || hasPermission('admin'));
  };

  const updateUserProfile = (updatedUser: Partial<User>) => {
    if (!user) return;
    
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    toast({
      title: "Profil opdateret",
      description: "Dine profiloplysninger er blevet opdateret.",
    });
  };

  const setPublicAccessMode = (value: boolean) => {
    console.log("Setting public access mode:", value);
    setIsPublicAccess(value);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated, 
        isPublicAccess,
        setPublicAccess: setPublicAccessMode,
        hasPermission, 
        canEditMachine,
        canAddServiceRecord,
        canMarkLubrication,
        canAddNotes,
        canUploadDocuments,
        canManageUsers,
        canAddTask,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth skal bruges inden for en AuthProvider');
  }
  return context;
};
