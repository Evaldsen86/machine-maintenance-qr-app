import React, { useMemo, useState } from 'react';
import { TimeEntryPeriod } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { formatDuration } from '@/utils/dateUtils';
import {
  TimeEntryWithMachine,
  calculateEmployeeStats,
  getPeriodLabel,
  getPeriodRange,
} from '@/utils/timeEntryUtils';
import { mockUsers } from '@/data/mockData';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface EmployeeTimeDashboardProps {
  entries: TimeEntryWithMachine[];
}

const WORKER_ROLES = ['mechanic', 'technician', 'blacksmith', 'lagermand'];

const getRoleName = (role: string): string => {
  const names: Record<string, string> = {
    admin: 'Administrator',
    leader: 'Leder',
    lagermand: 'Lagermand',
    driver: 'Chauffør',
    mechanic: 'Mekaniker',
    technician: 'Tekniker',
    blacksmith: 'Smed',
  };
  return names[role] || role;
};

const EmployeeTimeDashboard: React.FC<EmployeeTimeDashboardProps> = ({ entries }) => {
  const { user, hasPermission } = useAuth();
  const isLeaderOrAdmin = hasPermission('admin') || hasPermission('leader');
  const [period, setPeriod] = useState<TimeEntryPeriod>('week');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    isLeaderOrAdmin ? 'all' : user?.id || ''
  );

  const employees = useMemo(() => {
    try {
      const stored = localStorage.getItem('users');
      const users = stored ? JSON.parse(stored) : mockUsers;
      return users.filter((u: { role: string }) =>
        WORKER_ROLES.includes(u.role) || u.role === 'admin'
      );
    } catch {
      return mockUsers.filter((u) => WORKER_ROLES.includes(u.role));
    }
  }, []);

  const activeEmployees = useMemo(() => {
    const entryUserIds = new Set(entries.map((e) => e.userId));
    const fromUsers = employees.filter(
      (u: { id: string }) => entryUserIds.has(u.id) || isLeaderOrAdmin
    );
    return fromUsers;
  }, [employees, entries, isLeaderOrAdmin]);

  const statsList = useMemo(() => {
    const targetEmployees =
      selectedEmployeeId === 'all'
        ? activeEmployees
        : activeEmployees.filter((u: { id: string }) => u.id === selectedEmployeeId);

    return targetEmployees
      .map((emp: { id: string; name: string; role: string }) =>
        calculateEmployeeStats(entries, emp.id, emp.name, emp.role, period)
      )
      .filter((s) => s.entryCount > 0 || selectedEmployeeId !== 'all')
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [activeEmployees, entries, period, selectedEmployeeId]);

  const { start, end } = getPeriodRange(period);

  const teamTotals = useMemo(() => {
    return statsList.reduce(
      (acc, s) => ({
        totalMinutes: acc.totalMinutes + s.totalMinutes,
        approvedMinutes: acc.approvedMinutes + s.approvedMinutes,
        pendingMinutes: acc.pendingMinutes + s.pendingMinutes,
        entryCount: acc.entryCount + s.entryCount,
      }),
      { totalMinutes: 0, approvedMinutes: 0, pendingMinutes: 0, entryCount: 0 }
    );
  }, [statsList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Medarbejderoversigt</h2>
          <p className="text-sm text-muted-foreground">
            {format(start, 'd. MMM', { locale: da })} – {format(end, 'd. MMM yyyy', { locale: da })}
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimeEntryPeriod)}>
          <TabsList>
            <TabsTrigger value="week">Uge</TabsTrigger>
            <TabsTrigger value="biweekly">14 dage</TabsTrigger>
            <TabsTrigger value="month">Måned</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLeaderOrAdmin && (
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Vælg medarbejder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle medarbejdere</SelectItem>
            {activeEmployees.map((emp: { id: string; name: string }) => (
              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedEmployeeId === 'all' && isLeaderOrAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Team total – {getPeriodLabel(period).toLowerCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatDuration(teamTotals.totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">{teamTotals.entryCount} registreringer</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Godkendt tid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatDuration(teamTotals.approvedMinutes)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Afventer godkendelse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">
                {formatDuration(teamTotals.pendingMinutes)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Gns. pr. medarbejder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDuration(
                  statsList.length > 0
                    ? Math.round(teamTotals.totalMinutes / statsList.length)
                    : 0
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {statsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Ingen tidsregistreringer i {getPeriodLabel(period).toLowerCase()}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {statsList.map((stats) => (
            <Card key={stats.userId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{stats.userName}</CardTitle>
                      <CardDescription>{getRoleName(stats.role)}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={stats.approvalRate >= 80 ? 'default' : 'secondary'}>
                    {stats.approvalRate}% godkendt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-lg font-bold">{formatDuration(stats.totalMinutes)}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-2">
                    <p className="text-lg font-bold text-green-700">
                      {formatDuration(stats.approvedMinutes)}
                    </p>
                    <p className="text-xs text-muted-foreground">Godkendt</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <p className="text-lg font-bold text-amber-700">
                      {formatDuration(stats.pendingMinutes)}
                    </p>
                    <p className="text-xs text-muted-foreground">Afventer</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Godkendelsesrate</span>
                    <span>{stats.approvedCount}/{stats.entryCount} registreringer</span>
                  </div>
                  <Progress value={stats.approvalRate} className="h-2" />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gns. pr. dag</span>
                  <span className="font-medium">{formatDuration(stats.avgMinutesPerDay)}</span>
                </div>

                {stats.machineBreakdown.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Fordeling pr. maskine</p>
                    {stats.machineBreakdown.slice(0, 3).map((m) => (
                      <div key={m.machineId} className="flex justify-between text-sm">
                        <span className="truncate mr-2">{m.machineName}</span>
                        <span className="font-medium whitespace-nowrap">
                          {formatDuration(m.minutes)}
                        </span>
                      </div>
                    ))}
                    {stats.machineBreakdown.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{stats.machineBreakdown.length - 3} maskiner mere
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeTimeDashboard;
