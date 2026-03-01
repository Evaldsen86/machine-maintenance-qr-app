import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FolderPlus } from 'lucide-react';

interface FolderCreateFormProps {
  onSave: (folderName: string) => void;
  onCancel: () => void;
}

const FolderCreateForm: React.FC<FolderCreateFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    onSave(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="folder-name">Mappenavn</Label>
        <Input
          id="folder-name"
          placeholder="F.eks. Billeder af maskine"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuller
        </Button>
        <Button type="submit" disabled={name.trim().length < 2}>
          <FolderPlus className="h-4 w-4 mr-2" />
          Opret mappe
        </Button>
      </div>
    </form>
  );
};

export default FolderCreateForm;
