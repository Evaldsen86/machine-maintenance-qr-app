import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Archive, ListChecks } from 'lucide-react';
import TimeEntryManager from '@/components/timetracking/TimeEntryManager';
import EmployeeTimeDashboard from '@/components/timetracking/EmployeeTimeDashboard';
import TimeEntryArchive from '@/components/timetracking/TimeEntryArchive';
import { loadAllTimeEntries } from '@/utils/timeEntryUtils';
import { canRegisterTime } from '@/utils/rolePermissions';

const TimeRegistration: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const entries = useMemo(() => {
    const all = loadAllTimeEntries(false);
    if (!user) return [];
    const isLeaderOrAdmin = user.role === 'admin' || user.role === 'leader';
    if (isLeaderOrAdmin) return all;
    return all.filter((e) => e.userId === user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  if (!user || !canRegisterTime(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const isLeaderOrAdmin = user.role === 'admin' || user.role === 'leader';
  const pendingCount = entries.filter((e) => e.status === 'completed').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tidsregistrering</h1>
          <p className="text-muted-foreground mt-1">
            {isLeaderOrAdmin
              ? 'Godkend, ret og arkivér medarbejdernes tider – samlet oversigt'
              : 'Se dine registrerede timer og status på godkendelser'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Oversigt
              {pendingCount > 0 && isLeaderOrAdmin && (
                <span className="ml-1 rounded-full bg-amber-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              Medarbejdere
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Archive className="h-4 w-4" />
              Arkiv
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TimeEntryManager entries={entries} onRefresh={refresh} />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeTimeDashboard entries={entries} />
          </TabsContent>

          <TabsContent value="archive">
            <TimeEntryArchive onRefresh={refresh} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TimeRegistration;
