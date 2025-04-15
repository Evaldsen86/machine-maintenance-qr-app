
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Document, UserRole } from '@/types';
import { 
  Download, 
  FileText, 
  Book, 
  Award, 
  FileQuestion,
  CalendarDays,
  Upload,
  Shield,
  Globe,
  Users,
  Lock,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentPermissionsDialog from './DocumentPermissionsDialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "@/components/ui/use-toast";

interface MachineDocumentsProps {
  documents: Document[];
  canUpload: boolean;
  onDocumentAdd?: (document: Document) => void;
  onDocumentUpdate?: (document: Document) => void;
}

const MachineDocuments: React.FC<MachineDocumentsProps> = ({ 
  documents, 
  canUpload,
  onDocumentAdd,
  onDocumentUpdate
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const { user, canManageUsers } = useAuth();
  
  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.uploadedAt || b.uploadDate || '').getTime() - new Date(a.uploadedAt || a.uploadDate || '').getTime()
  );

  const hasAccessToDocument = (doc: Document): boolean => {
    if (!doc.accessLevel || doc.accessLevel === 'public') return true;
    
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    
    if (doc.accessLevel === 'restricted' && (doc.allowedRoles || doc.authorizedRoles)) {
      const roles = doc.allowedRoles || doc.authorizedRoles || [];
      return roles.includes(user.role);
    }
    
    if (doc.accessLevel === 'private' && doc.allowedUsers) {
      return doc.allowedUsers.includes(user.id);
    }
    
    return false;
  };

  const getDocumentIcon = (type: string | undefined) => {
    switch (type) {
      case 'manual':
        return <Book className="h-5 w-5" />;
      case 'service':
        return <FileText className="h-5 w-5" />;
      case 'certification':
        return <Award className="h-5 w-5" />;
      default:
        return <FileQuestion className="h-5 w-5" />;
    }
  };

  const getDocumentBadgeVariant = (type: string | undefined): "default" | "secondary" | "outline" | "destructive" => {
    switch (type) {
      case 'manual':
        return "secondary";
      case 'service':
        return "default";
      case 'certification':
        return "outline";
      default:
        return "outline";
    }
  };

  const translateDocumentType = (type: string | undefined): string => {
    switch (type) {
      case 'manual':
        return "Brugermanual";
      case 'service':
        return "Servicehåndbog";
      case 'certification':
        return "Certifikat";
      default:
        return "Andet";
    }
  };

  const getAccessLevelInfo = (doc: Document) => {
    const accessLevel = doc.accessLevel || 'public';
    
    switch(accessLevel) {
      case 'public':
        return {
          icon: <Globe className="h-4 w-4 text-blue-500" />,
          text: 'Offentlig'
        };
      case 'restricted':
        return {
          icon: <Users className="h-4 w-4 text-amber-500" />,
          text: 'Rollebaseret'
        };
      case 'private':
        return {
          icon: <Lock className="h-4 w-4 text-red-500" />,
          text: 'Privat'
        };
    }
  };

  const handleSaveDocument = (newDocument: Document) => {
    if (onDocumentAdd) {
      const docWithAccess = {
        ...newDocument,
        accessLevel: "public" as const
      };
      
      onDocumentAdd(docWithAccess);
    }
    setIsDialogOpen(false);
  };

  const handleUpdateDocumentPermissions = (updatedDocument: Document) => {
    if (onDocumentUpdate) {
      onDocumentUpdate(updatedDocument);
    }
  };

  const openPermissionsDialog = (doc: Document) => {
    setSelectedDocument(doc);
    setIsPermissionsDialogOpen(true);
  };

  const handleDocumentDownload = (doc: Document) => {
    // Check if the URL is valid
    try {
      const url = new URL(doc.fileUrl);
      
      // Create anchor element and trigger download
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = doc.title || 'document';
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Dokument åbnet",
        description: `Dokumentet '${doc.title}' åbnes i en ny fane.`,
      });
    } catch (error) {
      toast({
        title: "Fejl ved download",
        description: "Dokumentadressen er ikke gyldig. Kontakt venligst administratoren.",
        variant: "destructive"
      });
      console.error("Invalid URL:", doc.fileUrl);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Dokumentation</CardTitle>
          <CardDescription>
            Brugermanualer, servicehåndbøger og certifikater
          </CardDescription>
        </div>
        {canUpload && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Upload dokument
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DocumentUploadForm 
                onSave={handleSaveDocument}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {sortedDocuments.length > 0 ? (
          <div className="space-y-4">
            {sortedDocuments.map((document) => {
              const hasAccess = hasAccessToDocument(document);
              const accessInfo = getAccessLevelInfo(document);
              
              return hasAccess ? (
                <div 
                  key={document.id} 
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3 sm:mb-0">
                    <div className="mt-1 text-primary">
                      {getDocumentIcon(document.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{document.title}</h4>
                        <Badge variant={getDocumentBadgeVariant(document.type)}>
                          {translateDocumentType(document.type)}
                        </Badge>
                        <div className="flex items-center" title={accessInfo.text}>
                          {accessInfo.icon}
                        </div>
                      </div>
                      {document.description && (
                        <p className="text-sm text-muted-foreground mb-1">{document.description}</p>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        <span>Uploadet: {new Date(document.uploadDate).toLocaleDateString('da-DK')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageUsers() && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => openPermissionsDialog(document)}
                      >
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Tilladelser</span>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleDocumentDownload(document)}
                    >
                      <Download className="h-4 w-4" />
                      <span>Hent</span>
                    </Button>
                  </div>
                </div>
              ) : null;
            })}

            {canManageUsers() && sortedDocuments.filter(doc => !hasAccessToDocument(doc)).length > 0 && (
              <div className="text-center py-3 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {sortedDocuments.filter(doc => !hasAccessToDocument(doc)).length} dokumenter er skjult pga. adgangsbegrænsninger
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Ingen dokumentation fundet</p>
          </div>
        )}
      </CardContent>

      {selectedDocument && (
        <DocumentPermissionsDialog
          document={selectedDocument}
          isOpen={isPermissionsDialogOpen}
          onClose={() => setIsPermissionsDialogOpen(false)}
          onSave={handleUpdateDocumentPermissions}
        />
      )}
    </Card>
  );
};

export default MachineDocuments;
