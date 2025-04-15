import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Truck, Wrench, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import QRScanner from '@/components/QRScanner';

const Index = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'scan') {
      setShowQrScanner(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50 flex flex-col">
      <div className="flex flex-col flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md w-full mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="bg-primary/10 p-3 rounded-full inline-flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Maskine QR System</h1>
            <p className="text-muted-foreground">
              Scan QR koder for at se maskindata, servicehistorik og smøring
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log ind</TabsTrigger>
              <TabsTrigger value="scan">Scan QR</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 animate-slide-up">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@email.dk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Adgangskode
                    </label>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Glemt adgangskode?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logger ind..." : "Log ind"}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Administrator login: mje@transport.gl</p>
              </div>
            </TabsContent>
            
            <TabsContent value="scan" className="animate-slide-up">
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Scan en QR-kode</h2>
                <p className="text-muted-foreground text-sm">
                  Scan en maskine-QR-kode for hurtigt at se servicehistorik og detaljer uden at logge ind
                </p>
                <Button
                  onClick={() => setShowQrScanner(true)}
                  className="w-full"
                >
                  Start Scanning
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="border-t py-8">
        <div className="container flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
          <div className="md:w-1/2">
            <h2 className="text-xl font-semibold mb-2">Spor alt jeres udstyr</h2>
            <p className="text-muted-foreground text-sm">
              Hold styr på servicehistorik, smøring og opgaver for alle jeres maskiner
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 md:w-1/2">
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 rounded-full p-2 mb-2">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">Maskindata</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 rounded-full p-2 mb-2">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">Service</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 rounded-full p-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">Opgaver</span>
            </div>
          </div>
        </div>
      </div>
      
      {showQrScanner && (
        <QRScanner onClose={() => {
          setShowQrScanner(false);
          if (activeTab === 'scan') {
            setActiveTab('login');
          }
        }} />
      )}
    </div>
  );
};

export default Index;
