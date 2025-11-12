import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { TimeEntry, PayrollEntry } from '@/types';
import { formatDate, getStartOfMonth, getEndOfMonth } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import { Download, FileText, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PayrollManagerProps {
  timeEntries: TimeEntry[];
  onPayrollEntryUpdate?: (entry: PayrollEntry) => void;
  onPayrollEntryDelete?: (entryId: string) => void;
}

const PayrollManager: React.FC<PayrollManagerProps> = ({
  timeEntries,
  onPayrollEntryUpdate,
  onPayrollEntryDelete
}) => {
  const { user, hasPermission } = useAuth();
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getStartOfMonth().substring(0, 7)); // YYYY-MM
  const [notes, setNotes] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const handleGeneratePayroll = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal være logget ind for at generere lønseddel.",
      });
      return;
    }

    const [year, month] = selectedPeriod.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const periodEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const totalMinutes = periodEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const regularHours = Math.floor(totalMinutes / 60);
    const overtimeHours = Math.floor((totalMinutes % 60) / 30); // Count overtime in 30-minute increments

    const payrollEntry: PayrollEntry = {
      id: `payroll-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      period: selectedPeriod,
      regularHours,
      overtimeHours,
      status: 'draft',
      notes
    };

    setPayrollEntries(prev => [payrollEntry, ...prev]);

    if (onPayrollEntryUpdate) {
      onPayrollEntryUpdate(payrollEntry);
    }

    toast({
      title: "Lønseddel genereret",
      description: "Lønsedlen er blevet genereret og klar til godkendelse.",
    });
  };

  const handleApprovePayroll = (entryId: string) => {
    if (!user) return;

    const updatedEntry: PayrollEntry = {
      ...payrollEntries.find(entry => entry.id === entryId)!,
      status: 'approved',
      approvedBy: user.name,
      approvedAt: new Date().toISOString()
    };

    setPayrollEntries(prev => prev.map(entry => 
      entry.id === entryId ? updatedEntry : entry
    ));

    if (onPayrollEntryUpdate) {
      onPayrollEntryUpdate(updatedEntry);
    }

    toast({
      title: "Lønseddel godkendt",
      description: "Lønsedlen er blevet godkendt og klar til eksport.",
    });
  };

  const handleExportPayroll = (entryId: string) => {
    const entry = payrollEntries.find(entry => entry.id === entryId);
    if (!entry) return;

    const updatedEntry: PayrollEntry = {
      ...entry,
      status: 'exported',
      exportedAt: new Date().toISOString()
    };

    setPayrollEntries(prev => prev.map(e => 
      e.id === entryId ? updatedEntry : e
    ));

    if (onPayrollEntryUpdate) {
      onPayrollEntryUpdate(updatedEntry);
    }

    toast({
      title: "Lønseddel eksporteret",
      description: "Lønsedlen er blevet eksporteret til lønsystemet.",
    });
  };

  const handleDeletePayroll = (entryId: string) => {
    setEntryToDelete(entryId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;

    setPayrollEntries(prev => prev.filter(entry => entry.id !== entryToDelete));

    if (onPayrollEntryDelete) {
      onPayrollEntryDelete(entryToDelete);
    }

    setShowDeleteDialog(false);
    setEntryToDelete(null);

    toast({
      title: "Lønseddel slettet",
      description: "Lønsedlen er blevet slettet.",
    });
  };

  const canManagePayroll = hasPermission('admin');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lønsedler</CardTitle>
        <CardDescription>
          Generer og administrer lønsedler
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {canManagePayroll && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Periode</label>
                <Input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Noter</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tilføj eventuelle noter til lønsedlen..."
                className="min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleGeneratePayroll}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generer lønseddel
            </Button>
          </div>
        )}

        {payrollEntries.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Lønsedler</h3>
            <div className="space-y-2">
              {payrollEntries.map(entry => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {entry.userName} - {entry.period}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.regularHours} timer + {entry.overtimeHours} overarbejde
                    </div>
                    <div className="text-sm mt-1">{entry.notes}</div>
                  </div>
                  
                  {canManagePayroll && (
                    <div className="flex gap-2">
                      {entry.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprovePayroll(entry.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {entry.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportPayroll(entry.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {entry.status !== 'exported' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayroll(entry.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker på at du vil slette denne lønseddel?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes. Lønsedlen vil blive slettet permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PayrollManager;

 