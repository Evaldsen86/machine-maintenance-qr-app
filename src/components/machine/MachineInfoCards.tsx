import React, { useState } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Share, 
  LogIn,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Machine } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import MachineQRSection from './MachineQRSection';

interface MachineInfoCardsProps {
  machine: Machine;
}

const MachineInfoCards: React.FC<MachineInfoCardsProps> = ({ machine }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/machine/${machine.id}?qr=true`;

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Link kopieret",
          description: "Linket er kopieret til udklipsholder.",
        });
      })
      .catch(err => {
        toast({
          variant: "destructive",
          title: "Fejl ved kopiering",
          description: "Kunne ikke kopiere linket. Prøv igen.",
        });
      });
  };

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Handlinger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isAuthenticated && (
            <>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Udskriv Servicehistorik
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowQRDialog(true)}
                id="qr-dialog-trigger"
              >
                <QrCode className="mr-2 h-4 w-4" />
                QR-kode
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleShare}
              >
                <Share className="mr-2 h-4 w-4" />
                Del denne maskine
              </Button>
            </>
          )}
          {!isAuthenticated && (
            <Button 
              variant="default" 
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log ind for flere muligheder
            </Button>
          )}
        </CardContent>
      </Card>
      
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium">Tilføjet</div>
              <div className="text-muted-foreground">01/05/2023</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Sidst opdateret</div>
              <div className="text-muted-foreground">15/09/2023</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Antal servicebesøg</div>
              <div className="text-muted-foreground">{machine.serviceHistory?.length ?? 0}</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Næste inspektion</div>
              <div className="text-muted-foreground">01/01/2024</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Share Machine Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Del maskine</DialogTitle>
            <DialogDescription>
              Del denne maskine med andre ved at kopiere linket nedenfor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex space-x-2 items-center">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button onClick={handleCopyLink} size="sm" className="shrink-0">
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? "Kopieret" : "Kopier"}
            </Button>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>Luk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR-kode for {machine.name}</DialogTitle>
            <DialogDescription>
              Scan eller download QR-koden for hurtig adgang til maskinen.
            </DialogDescription>
          </DialogHeader>
          <div className="p-2">
            <MachineQRSection machine={machine as import('@/types').Machine} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MachineInfoCards;
