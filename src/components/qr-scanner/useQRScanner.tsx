import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useMachines } from '@/hooks/useMachines';

export const useQRScanner = (onClose: () => void, externalOnScan?: (data: string) => void) => {
  const navigate = useNavigate();
  const { setPublicAccess } = useAuth();
  const { machines } = useMachines();
  const [selectedTab, setSelectedTab] = useState('scan');
  
  const handleScan = (data: string) => {
    if (externalOnScan) {
      externalOnScan(data);
      return;
    }

    try {
      // Clean the scanned data
      const cleanData = data.trim();
      const cleanDataLower = cleanData.toLowerCase();
      
      // Try to find machine by ID (case-insensitive) or QR code
      const machine = machines.find(m => {
        const machineIdLower = m.id.toLowerCase();
        const machineQrCodeLower = m.qrCode?.toLowerCase() || '';
        
        return (
          m.id === cleanData ||
          machineIdLower === cleanDataLower ||
          machineIdLower === `machine-${cleanDataLower}` ||
          machineIdLower === cleanDataLower.replace('machine-', '') ||
          machineQrCodeLower === cleanDataLower ||
          m.qrCode === cleanData
        );
      });

      if (machine) {
        setPublicAccess(true);
        navigate(`/machine/${machine.id}`);
        onClose();
        return;
      }

      toast({
        title: "Maskine ikke fundet",
        description: "QR-koden matcher ikke en kendt maskine",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Ugyldig QR-kode",
        description: "QR-koden kunne ikke læses korrekt",
        variant: "destructive",
      });
    }
  };

  return {
    selectedTab,
    setSelectedTab,
    handleScan,
    machines
  };
};
