
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Document, UserRole } from '@/types';
import { Shield, Users, Globe, User } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { equipmentTranslations } from "@/utils/equipmentTranslations";
import { useAuth } from '@/hooks/useAuth';

interface DocumentPermissionsDialogProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: Document) => void;
}

const DocumentPermissionsDialog: React.FC<DocumentPermissionsDialogProps> = ({
  document,
  isOpen,
  onClose,
  onSave
}) => {
  const { user } = useAuth();
  
  const [accessLevel, setAccessLevel] = useState<'public' | 'restricted' | 'private'>(
    document.accessLevel || 'public'
  );
  
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
    document.allowedRoles || document.authorizedRoles || []
  );

  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    document.allowedUsers || []
  );

  const availableRoles: { label: string; value: UserRole }[] = [
    { label: 'Chaufør', value: 'driver' },
    { label: 'Mekaniker', value: 'mechanic' },
    { label: 'Tekniker', value: 'technician' },
    { label: 'Smed', value: 'blacksmith' },
    { label: 'Administrator', value: 'admin' }
  ];

  // Mock users for demonstration purposes
  // In a real implementation, this would come from a user list API
  const availableUsers = [
    { id: 'user1', name: 'Jan Jensen (Mekaniker)' },
    { id: 'user2', name: 'Peter Petersen (Smed)' },
    { id: 'user3', name: 'Hans Hansen (Chaufør)' },
    { id: 'user4', name: 'Lars Larsen (Tekniker)' }
  ];

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(current =>
      current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role]
    );
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(current =>
      current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    );
  };

  const handleSave = () => {
    const updatedDocument: Document = {
      ...document,
      accessLevel,
      allowedRoles: accessLevel === 'restricted' ? selectedRoles : undefined,
      authorizedRoles: accessLevel === 'restricted' ? selectedRoles : undefined,
      allowedUsers: accessLevel === 'private' ? selectedUsers : undefined
    };
    
    onSave(updatedDocument);
    
    toast({
      title: "Tilladelser opdateret",
      description: `Dokumentets tilladelser er blevet opdateret.`,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dokumenttilladelser</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Dokument: {document.title}</h4>
            
            <RadioGroup 
              value={accessLevel} 
              onValueChange={(value) => setAccessLevel(value as 'public' | 'restricted' | 'private')}
              className="space-y-3"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="public" id="public" />
                <div className="grid gap-1.5">
                  <Label htmlFor="public" className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-blue-500" />
                    Offentlig tilgængelig
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alle brugere kan se dette dokument, inklusive ikke-indloggede brugere via QR-kode.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="restricted" id="restricted" />
                <div className="grid gap-1.5">
                  <Label htmlFor="restricted" className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-amber-500" />
                    Begrænset til roller
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Kun brugere med specificerede roller kan se dette dokument.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="private" id="private" />
                <div className="grid gap-1.5">
                  <Label htmlFor="private" className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-red-500" />
                    Private adgangsrettigheder
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Kun specifikt udvalgte brugere kan se dette dokument.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {accessLevel === 'restricted' && (
            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium mb-2">Vælg roller med adgang:</h4>
              <div className="space-y-2">
                {availableRoles.map(role => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`role-${role.value}`}
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => handleRoleToggle(role.value)}
                    />
                    <label 
                      htmlFor={`role-${role.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {accessLevel === 'private' && (
            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium mb-2">Vælg brugere med adgang:</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {availableUsers.map(u => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`user-${u.id}`}
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={() => handleUserToggle(u.id)}
                    />
                    <label 
                      htmlFor={`user-${u.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-muted-foreground" />
                        {u.name}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuller
          </Button>
          <Button onClick={handleSave}>Gem tilladelser</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPermissionsDialog;
