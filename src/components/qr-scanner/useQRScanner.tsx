import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Machine } from '@/types';
import { getMachines } from '../../lib/api';

export const useQRScanner = (onClose: () => void, externalOnScan?: (data: string) => void) => {
  const navigate = useNavigate();
  const { setPublicAccess } = useAuth();
  const [selectedTab, setSelectedTab] = useState('scan');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const data = await getMachines();
        setMachines(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load machines from database');
        setLoading(false);
      }
    };

    loadMachines();
  }, []);
  
  const handleScan = (data: string) => {
    if (externalOnScan) {
      externalOnScan(data);
      return;
    }

    try {
      const machine = machines.find(m => m.id === data);

      if (machine) {
        setPublicAccess(true);
        navigate(`/machine/${data}`);
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
    machines,
    loading,
    error
  };
};
