import React from 'react';
import { Approval, Machine, User, Video } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, UserCheck, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface ApprovalStatusProps {
  approvals: Approval[];
  machine: Machine | null;
  user: User | null;
  onEdit?: (approval: Approval) => void;
  canEdit?: boolean;
  videos?: Video[];
}

const ApprovalStatus: React.FC<ApprovalStatusProps> = ({ approvals, machine, user, onEdit, canEdit = false, videos = [] }) => {
  // Filter approvals - if admin/mechanic, show all; otherwise show only for current user
  const filteredApprovals = approvals.filter(approval => {
    const matchesUser = !user || (user.role !== 'admin' && user.role !== 'mechanic') ? approval.userId === user?.id : true;
    const matchesMachine = !machine || approval.machineId === machine.id;
    return matchesUser && matchesMachine;
  });

  const getStatusBadge = (status: Approval['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Godkendt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Afvist
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Afventer
          </Badge>
        );
    }
  };

  if (filteredApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {machine 
              ? `Ingen godkendelser for ${machine.name}`
              : 'Ingen godkendelser fundet'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredApprovals.map(approval => (
        <Card key={approval.id} className="relative">
          {canEdit && onEdit && (
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(approval)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Rediger
              </Button>
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{approval.machineName}</CardTitle>
                <CardDescription>
                  Godkendelse for {approval.userName}
                </CardDescription>
              </div>
              {getStatusBadge(approval.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Godkendt af</p>
                <p className="font-medium">{approval.approvedByName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dato</p>
                <p className="font-medium">
                  {format(new Date(approval.approvedAt), 'dd MMMM yyyy', { locale: da })}
                </p>
              </div>
            </div>

            {approval.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Noter</p>
                <p className="text-sm">{approval.notes}</p>
              </div>
            )}

            {approval.videoIds && approval.videoIds.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Påkrævede videoer ({approval.videoIds.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {approval.videoIds.map(videoId => {
                    const video = videos.find(v => v.id === videoId);
                    return (
                      <Badge key={videoId} variant="outline">
                        {video ? video.title : `Video ID: ${videoId.substring(0, 8)}...`}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ApprovalStatus;

