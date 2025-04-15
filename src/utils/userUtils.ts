
import { UserRole } from '@/types';

// Get the display name for a role
export const getRoleName = (role: UserRole): string => {
  switch(role) {
    case 'admin': return 'Administrator';
    case 'driver': return 'Chauffør';
    case 'mechanic': return 'Mekaniker';
    case 'technician': return 'Tekniker';
    case 'blacksmith': return 'Smed';
    case 'viewer': return 'Gæst';
    case 'guest': return 'Gæst';
    case 'customer': return 'Kunde';
    default: return role;
  }
};

// Get the badge variant for a role
export const getRoleBadgeVariant = (role: UserRole) => {
  switch(role) {
    case 'admin': return 'destructive';
    case 'mechanic':
    case 'technician':
    case 'blacksmith': return 'default';
    case 'driver': return 'secondary';
    case 'customer': return 'secondary';
    default: return 'outline';
  }
};

// Get initials from a name
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};
