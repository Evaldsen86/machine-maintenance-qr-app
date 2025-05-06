import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DocumentPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: { canEdit: boolean; canView: boolean }) => void;
}

const DocumentPermissionsDialog: React.FC<DocumentPermissionsDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [permissions, setPermissions] = React.useState({
    canEdit: false,
    canView: true,
  });

  const handleSave = () => {
    onSave(permissions);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Document Permissions</DialogTitle>
          <DialogDescription>
            Set permissions for this document
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="canView">Can View</Label>
            <Input
              id="canView"
              type="checkbox"
              checked={permissions.canView}
              onChange={(e) =>
                setPermissions((prev) => ({ ...prev, canView: e.target.checked }))
              }
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="canEdit">Can Edit</Label>
            <Input
              id="canEdit"
              type="checkbox"
              checked={permissions.canEdit}
              onChange={(e) =>
                setPermissions((prev) => ({ ...prev, canEdit: e.target.checked }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPermissionsDialog; 