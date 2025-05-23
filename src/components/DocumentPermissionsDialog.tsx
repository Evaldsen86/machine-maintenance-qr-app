import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UserRole, User } from '@/types';
import { mockUsers } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import Select from 'react-select';

interface DocumentPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document?: any;
  onSave: (permissions: {
    viewRoles: UserRole[];
    downloadRoles: UserRole[];
    viewUsers: string[];
    downloadUsers: string[];
  }) => void;
}

const ALL_ROLES: UserRole[] = [
  'admin', 'mechanic', 'technician', 'driver', 'blacksmith', 'guest', 'viewer', 'customer'
];

const DocumentPermissionsDialog: React.FC<DocumentPermissionsDialogProps> = ({
  isOpen,
  onClose,
  document,
  onSave,
}) => {
  const [viewRoles, setViewRoles] = React.useState<UserRole[]>(document?.viewRoles || []);
  const [downloadRoles, setDownloadRoles] = React.useState<UserRole[]>(document?.downloadRoles || []);
  const [viewUsers, setViewUsers] = React.useState<string[]>(document?.viewUsers || []);
  const [downloadUsers, setDownloadUsers] = React.useState<string[]>(document?.downloadUsers || []);

  const handleSave = () => {
    onSave({ viewRoles, downloadRoles, viewUsers, downloadUsers });
    onClose();
  };

  const roleOptions = ALL_ROLES.map(role => ({ value: role, label: role }));
  const userOptions = mockUsers.map(user => ({ value: user.id, label: `${user.name} (${user.role})` }));

  // For react-select
  const viewRoleValues = roleOptions.filter(opt => viewRoles.includes(opt.value));
  const downloadRoleValues = roleOptions.filter(opt => downloadRoles.includes(opt.value));
  const viewUserValues = userOptions.filter(opt => viewUsers.includes(opt.value));
  const downloadUserValues = userOptions.filter(opt => downloadUsers.includes(opt.value));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokumentrettigheder</DialogTitle>
          <DialogDescription>
            Vælg hvem der må se og hvem der må downloade dette dokument
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div>
              <div className="font-semibold mb-1">Roller med adgang til at se</div>
              <Select
                isMulti
                options={roleOptions}
                value={viewRoleValues}
                onChange={opts => setViewRoles(opts.map(o => o.value))}
                placeholder="Vælg roller..."
                classNamePrefix="react-select"
                closeMenuOnSelect={false}
                isSearchable={true}
                isClearable={true}
                noOptionsMessage={() => "Ingen roller fundet"}
                loadingMessage={() => "Søger..."}
              />
            </div>
            <div>
              <div className="font-semibold mb-1">Roller med adgang til at downloade</div>
              <Select
                isMulti
                options={roleOptions}
                value={downloadRoleValues}
                onChange={opts => setDownloadRoles(opts.map(o => o.value))}
                placeholder="Vælg roller..."
                classNamePrefix="react-select"
                closeMenuOnSelect={false}
                isSearchable={true}
                isClearable={true}
                noOptionsMessage={() => "Ingen roller fundet"}
                loadingMessage={() => "Søger..."}
              />
            </div>
            <div>
              <div className="font-semibold mb-1">Brugere med adgang til at se</div>
              <Select
                isMulti
                options={userOptions}
                value={viewUserValues}
                onChange={opts => setViewUsers(opts.map(o => o.value))}
                placeholder="Vælg brugere..."
                classNamePrefix="react-select"
                closeMenuOnSelect={false}
                isSearchable={true}
                isClearable={true}
                noOptionsMessage={() => "Ingen brugere fundet"}
                loadingMessage={() => "Søger..."}
              />
            </div>
            <div>
              <div className="font-semibold mb-1">Brugere med adgang til at downloade</div>
              <Select
                isMulti
                options={userOptions}
                value={downloadUserValues}
                onChange={opts => setDownloadUsers(opts.map(o => o.value))}
                placeholder="Vælg brugere..."
                classNamePrefix="react-select"
                closeMenuOnSelect={false}
                isSearchable={true}
                isClearable={true}
                noOptionsMessage={() => "Ingen brugere fundet"}
                loadingMessage={() => "Søger..."}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Annuller
          </Button>
          <Button onClick={handleSave}>Gem</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPermissionsDialog; 