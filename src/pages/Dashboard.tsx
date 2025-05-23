import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, Search, Truck, Users, MapPin, Trash, QrCodeIcon } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MachineCard from '@/components/MachineCard';
import MachineMap from '@/components/MachineMap';
import MachineAddForm from '@/components/machine/MachineAddForm';
import { BatchQRGenerator } from '@/components/machine/BatchQRGenerator';
import { useAuth } from '@/hooks/useAuth';
import { mockMachines } from '@/data/mockData';
import QRScanner from '@/components/QRScanner';
import { Machine } from '@/types';
import { toast } from "@/components/ui/use-toast";

const LOCAL_STORAGE_KEY = 'dashboard_machines';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  
  const [machines, setMachines] = useState<Machine[]>(() => {
    try {
      const storedMachines = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedMachines ? JSON.parse(storedMachines) : mockMachines;
    } catch (error) {
      console.error("Error loading machines from localStorage:", error);
      return mockMachines;
    }
  });
  
  const [showAddMachineDialog, setShowAddMachineDialog] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  
  React.useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(machines));
    } catch (error) {
      console.error("Error saving machines to localStorage:", error);
    }
  }, [machines]);
  
  const filteredMachines = machines.filter(machine => 
    machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    machine.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    if (viewMode === 'map') {
      navigate(`/machine/${machine.id}`);
    }
  };

  const handleAddMachine = (newMachine: Machine) => {
    const updatedMachines = [newMachine, ...machines];
    setMachines(updatedMachines);
    setShowAddMachineDialog(false);
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedMachines));
    } catch (error) {
      console.error("Error saving new machine to localStorage:", error);
    }
    
    navigate(`/machine/${newMachine.id}`);
    
    toast({
      title: "Maskine tilføjet",
      description: `${newMachine.name} er blevet tilføjet til systemet.`,
    });
  };

  const handleDeleteMachine = (machine: Machine) => {
    setMachineToDelete(machine);
  };

  const confirmDeleteMachine = () => {
    if (!machineToDelete) return;
    
    const updatedMachines = machines.filter(m => m.id !== machineToDelete.id);
    setMachines(updatedMachines);
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedMachines));
    } catch (error) {
      console.error("Error updating localStorage after deletion:", error);
    }
    
    setMachineToDelete(null);
    
    toast({
      title: "Maskine slettet",
      description: `${machineToDelete.name} er blevet fjernet fra systemet.`,
    });
  };

  const renderMachineCard = (machine: Machine) => {
    return (
      <div key={machine.id} className="relative">
        <MachineCard 
          machine={machine} 
          onEdit={() => {
            navigate(`/machine/${machine.id}`);
          }}
        />
        {hasPermission('admin') && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 z-20"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeleteMachine(machine);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Velkommen, {user?.name}! Her er en oversigt over dine maskiner.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowQrScanner(true)}
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </Button>
              
              {hasPermission('admin') && (
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setShowAddMachineDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Ny Maskine</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <div className="md:hidden">
                <img 
                  src={machines[0]?.equipment[0]?.images?.[0] || '/placeholder.svg'} 
                  alt="Maskine banner" 
                  className="w-full h-24 object-cover"
                />
              </div>
              
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Maskiner i alt
                      </CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{machines.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Lastbiler, kraner og spil
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Aktive Opgaver
                      </CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">3</div>
                      <p className="text-xs text-muted-foreground">
                        Planlagte serviceopgaver
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Servicerede i år
                      </CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">5</div>
                      <p className="text-xs text-muted-foreground">
                        Maskiner med service i 2023
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Lokationer
                      </CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{[...new Set(machines.map(m => m.location).filter(Boolean))].length}</div>
                      <p className="text-xs text-muted-foreground">
                        Aktive placeringer
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <Tabs defaultValue="grid" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="grid" onClick={() => setViewMode('grid')}>
                    <Truck className="h-4 w-4 mr-2" />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="map" onClick={() => setViewMode('map')}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Kort
                  </TabsTrigger>
                  {hasPermission('admin') && (
                    <TabsTrigger value="qr">
                      <QrCodeIcon className="h-4 w-4 mr-2" />
                      QR-koder
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søg maskiner..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <TabsContent value="grid" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMachines.map(renderMachineCard)}
                </div>
              </TabsContent>

              <TabsContent value="map" className="space-y-4">
                <MachineMap
                  machines={filteredMachines}
                  selectedMachine={selectedMachine}
                  onSelectMachine={handleSelectMachine}
                />
              </TabsContent>

              {hasPermission('admin') && (
                <TabsContent value="qr" className="space-y-4">
                  <BatchQRGenerator machines={machines} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>
      
      {showQrScanner && (
        <QRScanner onClose={() => setShowQrScanner(false)} />
      )}

      <Dialog open={showAddMachineDialog} onOpenChange={setShowAddMachineDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <MachineAddForm
            onSave={handleAddMachine}
            onCancel={() => setShowAddMachineDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!machineToDelete} onOpenChange={(open) => !open && setMachineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker på at du vil slette denne maskine?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes. Maskinen vil blive slettet permanent fra systemet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMachine} className="bg-destructive text-destructive-foreground">
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
