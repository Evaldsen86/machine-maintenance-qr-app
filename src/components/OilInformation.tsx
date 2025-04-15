import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OilType } from '@/types';
import { Droplet, Plus } from 'lucide-react';
import OilAddForm from './OilAddForm';

interface OilInformationProps {
  oils: OilType[];
  onAddOil: (oilData: OilType) => void;
  canEdit?: boolean;
}

const OilInformation: React.FC<OilInformationProps> = ({ oils, onAddOil, canEdit = false }) => {
  const [open, setOpen] = useState(false);
  
  // Function to format specifications that could be either a string or a Record
  const formatSpecifications = (specs: string | Record<string, string> | undefined): React.ReactNode => {
    if (!specs) return "";
    
    if (typeof specs === 'string') {
      return specs;
    } else {
      // Convert the record to a formatted string
      return Object.entries(specs)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Olie Information</CardTitle>
          <CardDescription>Oversigt over olier og smøremidler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Viskositet</TableHead>
                  <TableHead>Mængde</TableHead>
                  <TableHead>Specifikationer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oils.map((oil) => (
                  <TableRow key={oil.id}>
                    <TableCell>{oil.name}</TableCell>
                    <TableCell>{oil.type}</TableCell>
                    <TableCell>{oil.viscosity}</TableCell>
                    <TableCell>{oil.quantity || 'N/A'}</TableCell>
                    <TableCell>{formatSpecifications(oil.specifications)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {canEdit && (
            <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tilføj Olie
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj ny olie</DialogTitle>
          </DialogHeader>
          <OilAddForm onSave={onAddOil} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OilInformation;
