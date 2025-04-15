
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Home, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';

const MachineNotFound: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 page-container flex flex-col items-center justify-center py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-lg">Maskine ikke fundet</AlertTitle>
          <AlertDescription className="text-sm">
            Den angivne maskine kunne ikke findes. Kontrollér URL'en og prøv igen.
            Dette kan skyldes, at maskinen er blevet slettet, eller at du ikke har adgang til den.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col md:flex-row gap-4 mt-8 w-full max-w-md">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="default"
            className="flex items-center justify-center w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Til oversigten
          </Button>
          
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="flex items-center justify-center w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage
          </Button>
          
          {hasPermission('admin') && (
            <Button
              onClick={() => navigate('/add-machine')}
              variant="default"
              className="flex items-center justify-center w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tilføj ny maskine
            </Button>
          )}
        </div>
        
        <div className="mt-6">
          <Button 
            variant="ghost" 
            className="text-sm"
            onClick={() => {
              toast({
                title: "Fejlrapport sendt",
                description: "Vi har registreret fejlen og vil undersøge den.",
              });
            }}
          >
            Rapportér et problem
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MachineNotFound;
