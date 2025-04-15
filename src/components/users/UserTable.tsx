
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eye, UserCog, UserX, UserIcon } from 'lucide-react';
import { User } from '@/types';
import { getInitials, getRoleName, getRoleBadgeVariant } from '@/utils/userUtils';

interface UserTableProps {
  users: User[];
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  onViewUser, 
  onEditUser, 
  onDeleteUser 
}) => {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Bruger</TableHead>
            <TableHead>Navn</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rolle</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                <div className="flex flex-col items-center justify-center">
                  <UserIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <p>Ingen brugere fundet</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage || ""} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleName(user.role)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => onViewUser(user)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Vis</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Se brugerdetaljer</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => onEditUser(user)}>
                          <UserCog className="h-4 w-4" />
                          <span className="sr-only">Rediger</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rediger bruger</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDeleteUser(user.id)}
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Slet</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Slet bruger</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
