import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Archive, Search, RotateCcw } from 'lucide-react';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import {
  TimeEntryWithMachine,
  getStatusLabel,
  getStatusVariant,
  loadArchivedTimeEntries,
  restoreTimeEntry,
} from '@/utils/timeEntryUtils';

interface TimeEntryArchiveProps {
  onRefresh: () => void;
}

const TimeEntryArchive: React.FC<TimeEntryArchiveProps> = ({ onRefresh }) => {
  const { user, hasPermission } = useAuth();
  const isLeaderOrAdmin = hasPermission('admin') || hasPermission('leader');
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState<TimeEntryWithMachine[]>(() => loadArchivedTimeEntries());

  const refreshArchive = () => {
    setArchived(loadArchivedTimeEntries());
    onRefresh();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = archived;
    if (!isLeaderOrAdmin && user) {
      list = list.filter((e) => e.userId === user.id);
    }
    if (!q) return list;
    return list.filter(
      (e) =>
        e.userName.toLowerCase().includes(q) ||
        e.machineName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [archived, search, isLeaderOrAdmin, user]);

  const handleRestore = (entry: TimeEntryWithMachine) => {
    restoreTimeEntry(entry);
    refreshArchive();
    toast({ title: 'Gendannet', description: 'Tidsregistreringen er flyttet tilbage til oversigten.' });
  };

  const totalMinutes = filtered.reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          <div>
            <CardTitle>Arkiv</CardTitle>
            <CardDescription>
              Godkendte og afviste tidsregistreringer der er arkiveret
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søg i arkiv..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} poster · {formatDuration(totalMinutes)} i alt
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Arkivet er tomt. Godkendte eller afviste registreringer kan arkiveres fra oversigten.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dato</TableHead>
                  <TableHead>Medarbejder</TableHead>
                  <TableHead>Maskine</TableHead>
                  <TableHead>Varighed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Arkiveret</TableHead>
                  {isLeaderOrAdmin && <TableHead className="text-right">Handling</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(entry.startTime)}
                    </TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell>{entry.machineName}</TableCell>
                    <TableCell className="font-medium">
                      {entry.duration != null ? formatDuration(entry.duration) : '–'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(entry.status)}>
                        {getStatusLabel(entry.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.archivedAt
                        ? formatDateTime(entry.archivedAt)
                        : '–'}
                      {entry.archivedBy && (
                        <div className="text-xs">af {entry.archivedBy}</div>
                      )}
                    </TableCell>
                    {isLeaderOrAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(entry)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Gendan
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeEntryArchive;
