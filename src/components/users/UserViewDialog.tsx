
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DialogFooter } from "@/components/ui/dialog";
import { Eye, EyeOff, UserCog } from 'lucide-react';
import { User } from '@/types';
import { getInitials, getRoleName, getRoleBadgeVariant } from '@/utils/userUtils';

interface UserViewDialogProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

const UserViewDialog: React.FC<UserViewDialogProps> = ({ user, onClose, onEdit }) => {
  const [showPasscode, setShowPasscode] = useState(false);
  
  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.profileImage || ""} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-medium">{user.name}</h3>
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {getRoleName(user.role)}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 pt-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p>{user.email}</p>
        </div>
        
        {user.phone && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Telefon</p>
            <p>{user.phone}</p>
          </div>
        )}
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Adgangskode</p>
          <div className="flex items-center">
            <p className="font-mono">
              {showPasscode 
                ? user.passcode || "Ingen adgangskode" 
                : user.passcode 
                  ? "••••••••" 
                  : "Ingen adgangskode"}
            </p>
            {user.passcode && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-8" 
                onClick={() => setShowPasscode(!showPasscode)}
              >
                {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {user.certificates && user.certificates.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Certifikater</p>
            <div className="flex flex-wrap gap-1">
              {user.certificates.map((cert, i) => (
                <Badge key={i} variant="outline">{cert}</Badge>
              ))}
            </div>
          </div>
        )}

        {user.skills && user.skills.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Kompetencer</p>
            <div className="flex flex-wrap gap-1">
              {user.skills.map((skill, i) => (
                <Badge key={i} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        {user.notes && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Noter</p>
            <p>{user.notes}</p>
          </div>
        )}
      </div>
      
      <DialogFooter className="pt-4">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Luk
        </Button>
        <Button onClick={onEdit}>
          <UserCog className="h-4 w-4 mr-2" />
          Rediger bruger
        </Button>
      </DialogFooter>
    </div>
  );
};

export default UserViewDialog;
