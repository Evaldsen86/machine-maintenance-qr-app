import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/utils/currencyUtils';
import { Offer, OfferStatus } from '@/types';
import { FileText } from 'lucide-react';

const STORAGE_KEY = 'offers';

const statusLabels: Record<OfferStatus, string> = {
  draft: 'Kladde',
  sent: 'Sendt',
  accepted: 'Accepteret',
  rejected: 'Afvist',
};

interface MachineOffersCardProps {
  machineId: string;
}

const MachineOffersCard: React.FC<MachineOffersCardProps> = ({ machineId }) => {
  const navigate = useNavigate();
  const offers = useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as Offer[];
      return parsed.filter(o => o.machineId === machineId);
    } catch {
      return [];
    }
  }, [machineId]);

  if (offers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Tilbud knyttet til maskinen
        </CardTitle>
        <CardDescription>
          {offers.length} tilbud er koblet til denne maskine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {offers.map(offer => (
          <div
            key={offer.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <div className="font-medium">{offer.title}</div>
              <div className="text-sm text-muted-foreground">{offer.customerName}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{statusLabels[offer.status]}</Badge>
              <span className="font-medium">{formatCurrency(offer.amount)}</span>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/dashboard?tab=offers')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Gå til tilbud i Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

export default MachineOffersCard;
