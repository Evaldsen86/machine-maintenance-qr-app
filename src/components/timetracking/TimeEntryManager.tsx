import React, { useState, useMemo } from 'react';
import { TimeEntry } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Edit,
  Archive,
  Trash2,
  Search,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import {
  TimeEntryWithMachine,
  getStatusLabel,
  getStatusVariant,
  saveTimeEntry,
  deleteTimeEntry,
  archiveTimeEntry,
} from '@/utils/timeEntryUtils';
import { useInventory } from '@/hooks/useInventory';
import { restoreInventoryForDeletedTimeEntry } from '@/utils/inventoryPartUsage';
import TimeEntryEditDialog from './TimeEntryEditDialog';

interface TimeEntryManagerProps {
  entries: TimeEntryWithMachine[];
  onRefresh: () => void;
}

type StatusFilter = 'all' | 'completed' | 'approved' | 'rejected';

const TimeEntryManager: React.FC<TimeEntryManagerProps> = ({ entries, onRefresh }) => {
  const { user, hasPermission } = useAuth();
  const { changeQuantity } = useInventory();
  const isLeaderOrAdmin = hasPermission('admin') || hasPermission('leader');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithMachine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntryWithMachine | null>(null);

  const employees = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => map.set(e.userId, e.userName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter((e) => {
      if (e.status === 'active') return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (employeeFilter !== 'all' && e.userId !== employeeFilter) return false;
      if (!q) return true;
      return (
        e.userName.toLowerCase().includes(q) ||
        e.machineName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        formatDateTime(e.startTime).toLowerCase().includes(q)
      );
    });
  }, [entries, search, statusFilter, employeeFilter]);

  const pendingCount = entries.filter((e) => e.status === 'completed').length;

  const canEditEntry = (entry: TimeEntry) => {
    if (!user) return false;
    if (isLeaderOrAdmin) return true;
    return entry.userId === user.id;
  };

  const canApprove = (entry: TimeEntry) =>
    isLeaderOrAdmin && entry.status === 'completed';

  const handleApprove = (entry: TimeEntryWithMachine) => {
    if (!user) return;
    const updated: TimeEntry = {
      ...entry,
      status: 'approved',
      approvedBy: user.name,
      approvedAt: new Date().toISOString(),
    };
    saveTimeEntry(updated);
    onRefresh();
    toast({ title: 'Godkendt', description: `Tid for ${entry.userName} er godkendt.` });
  };

  const handleReject = (entry: TimeEntryWithMachine) => {
    if (!user) return;
    const updated: TimeEntry = {
      ...entry,
      status: 'rejected',
      approvedBy: user.name,
      approvedAt: new Date().toISOString(),
    };
    saveTimeEntry(updated);
    onRefresh();
    toast({ title: 'Afvist', description: `Tid for ${entry.userName} er afvist.` });
  };

  const handleBatchApprove = () => {
    if (!user) return;
    const toApprove = filtered.filter(
      (e) => selectedIds.has(e.id) && e.status === 'completed'
    );
    toApprove.forEach((entry) => {
      saveTimeEntry({
        ...entry,
        status: 'approved',
        approvedBy: user.name,
        approvedAt: new Date().toISOString(),
      });
    });
    setSelectedIds(new Set());
    onRefresh();
    toast({
      title: 'Batch godkendt',
      description: `${toApprove.length} registreringer er godkendt.`,
    });
  };

  const handleArchive = (entry: TimeEntryWithMachine) => {
    if (!user) return;
    archiveTimeEntry(entry, user.name);
    onRefresh();
    toast({ title: 'Arkiveret', description: 'Tidsregistreringen er flyttet til arkiv.' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await restoreInventoryForDeletedTimeEntry(deleteTarget, changeQuantity);
    } catch (error) {
      console.error('Error restoring inventory:', error);
      toast({
        variant: 'destructive',
        title: 'Lagerfejl',
        description: 'Kunne ikke tilbageføre reservedele til lageret.',
      });
      return;
    }

    deleteTimeEntry(deleteTarget.machineId, deleteTarget.id);
    setDeleteTarget(null);
    onRefresh();
    toast({ title: 'Slettet', description: 'Tidsregistreringen er slettet.' });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pending = filtered.filter((e) => e.status === 'completed');
    if (selectedIds.size === pending.length && pending.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((e) => e.id)));
    }
  };

  const totalMinutes = filtered.reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">I alt (filter)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDuration(totalMinutes)}</p>
            <p className="text-xs text-muted-foreground">{filtered.length} registreringer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Afventer godkendelse</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Godkendt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {entries.filter((e) => e.status === 'approved').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medarbejdere</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{employees.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Tidsregistreringer</CardTitle>
              <CardDescription>
                Oversigt over alle registreringer – godkend, ret og arkivér her
              </CardDescription>
            </div>
            {isLeaderOrAdmin && selectedIds.size > 0 && (
              <Button size="sm" onClick={handleBatchApprove}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Godkend valgte ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søg medarbejder, maskine, beskrivelse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statusser</SelectItem>
                <SelectItem value="completed">Afventer godkendelse</SelectItem>
                <SelectItem value="approved">Godkendt</SelectItem>
                <SelectItem value="rejected">Afvist</SelectItem>
              </SelectContent>
            </Select>
            {isLeaderOrAdmin && (
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Medarbejder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle medarbejdere</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ingen tidsregistreringer matcher dit filter.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isLeaderOrAdmin && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            filtered.filter((e) => e.status === 'completed').length > 0 &&
                            selectedIds.size === filtered.filter((e) => e.status === 'completed').length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Dato</TableHead>
                    <TableHead>Medarbejder</TableHead>
                    <TableHead>Maskine</TableHead>
                    <TableHead>Varighed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      {isLeaderOrAdmin && (
                        <TableCell>
                          {entry.status === 'completed' && (
                            <Checkbox
                              checked={selectedIds.has(entry.id)}
                              onCheckedChange={() => toggleSelect(entry.id)}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">{formatDateTime(entry.startTime)}</div>
                        {entry.endTime && (
                          <div className="text-xs text-muted-foreground">
                            til {formatDateTime(entry.endTime)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{entry.userName}</TableCell>
                      <TableCell>
                        <Link
                          to={`/machine/${entry.machineId}`}
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {entry.machineName}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.duration != null ? formatDuration(entry.duration) : '–'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(entry.status)}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canApprove(entry) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleApprove(entry)}
                                title="Godkend"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleReject(entry)}
                                title="Afvis"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {canEditEntry(entry) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingEntry(entry)}
                              title="Rediger"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {(entry.status === 'approved' || entry.status === 'rejected') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleArchive(entry)}
                              title="Arkivér"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          {canEditEntry(entry) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteTarget(entry)}
                              title="Slet"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TimeEntryEditDialog
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={(updated) => {
          saveTimeEntry(updated);
          onRefresh();
          toast({ title: 'Opdateret', description: 'Tidsregistreringen er gemt.' });
        }}
        canEditHours={editingEntry ? canEditEntry(editingEntry) : false}
        machineName={editingEntry?.machineName}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet tidsregistrering?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeEntryManager;
