
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileEdit, Trash2, QrCode, View, MoreVertical } from 'lucide-react';
import { Machine } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MachineDetailHeaderProps {
  machine: Machine;
  onEdit?: () => void;
  onDelete?: () => void;
  onView3D?: () => void;
}

const MachineDetailHeader: React.FC<MachineDetailHeaderProps> = ({ 
  machine,
  onEdit,
  onDelete,
  onView3D
}) => {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const isMobile = useIsMobile();
  
  const canEditThisMachine = () => {
    if (hasPermission('admin')) return true;
    
    if (!machine.editPermissions || machine.editPermissions.length === 0) {
      return hasPermission('mechanic') || hasPermission('technician');
    }
    
    return user && machine.editPermissions.includes(user.role);
  };

  const handleQRClick = () => {
    const qrDialogElement = document.getElementById('qr-dialog-trigger');
    if (qrDialogElement) {
      (qrDialogElement as HTMLButtonElement).click();
    }
  };
  
  return (
    <header className="page-header">
      <div className="page-container py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {!isMobile && "Tilbage"}
          </Button>
          <h1 className="text-lg font-semibold">Maskine detaljer</h1>
        </div>
        
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView3D && (
                <DropdownMenuItem onClick={onView3D}>
                  <View className="h-4 w-4 mr-2" />
                  3D Visning
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleQRClick}>
                <QrCode className="h-4 w-4 mr-2" />
                QR-kode
              </DropdownMenuItem>
              
              {canEditThisMachine() && (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <FileEdit className="h-4 w-4 mr-2" />
                      Redigér
                    </DropdownMenuItem>
                  )}
                  
                  {onDelete && hasPermission('admin') && (
                    <DropdownMenuItem 
                      className="text-destructive" 
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slet
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            {onView3D && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex items-center gap-1"
                onClick={onView3D}
              >
                <View className="h-4 w-4" />
                3D Visning
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 flex items-center gap-1"
              onClick={handleQRClick}
            >
              <QrCode className="h-4 w-4" />
              QR-kode
            </Button>
            
            {canEditThisMachine() && (
              <>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex items-center gap-1"
                    onClick={onEdit}
                  >
                    <FileEdit className="h-4 w-4" />
                    Redigér
                  </Button>
                )}
                
                {onDelete && hasPermission('admin') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 flex items-center gap-1"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Slet
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default MachineDetailHeader;
