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
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ImageIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentPermissionsDialog from './DocumentPermissionsDialog';
import FolderCreateForm from './FolderCreateForm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "@/components/ui/use-toast";

interface MachineDocumentsProps {
  documents: Document[];
  canUpload: boolean;
  onDocumentAdd?: (document: Document) => void;
  onDocumentsAdd?: (documents: Document[]) => void;
  onDocumentUpdate?: (document: Document) => void;
}

const isFolder = (doc: Document) => doc.type === 'folder';

const MachineDocuments: React.FC<MachineDocumentsProps> = ({ 
  documents, 
  canUpload,
  onDocumentAdd,
  onDocumentsAdd,
  onDocumentUpdate
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [uploadToFolderId, setUploadToFolderId] = useState<string | undefined>();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const { user, canManageUsers } = useAuth();
  
  const folders = documents.filter(isFolder);
  const fileDocuments = documents.filter(d => !isFolder(d));
  
  const sortedDocuments = [...fileDocuments].sort((a, b) => 
    new Date(b.uploadedAt || b.uploadDate || '').getTime() - new Date(a.uploadedAt || a.uploadDate || '').getTime()
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const openUploadToFolder = (folderId: string) => {
    setUploadToFolderId(folderId);
    setIsDialogOpen(true);
  };

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

  const canViewDocument = (doc: Document): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (doc.viewRoles && doc.viewRoles.includes(user.role)) return true;
    if (doc.viewUsers && doc.viewUsers.includes(user.id)) return true;
    if (!doc.viewRoles && !doc.viewUsers) return hasAccessToDocument(doc);
    return false;
  };

  const canDownloadDocument = (doc: Document): boolean => {
    if (isFolder(doc)) return false;
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (doc.downloadRoles && doc.downloadRoles.includes(user.role)) return true;
    if (doc.downloadUsers && doc.downloadUsers.includes(user.id)) return true;
    if (!doc.downloadRoles && !doc.downloadUsers) return hasAccessToDocument(doc);
    return false;
  };

  const getDocumentIcon = (type: string | undefined) => {
    switch (type) {
      case 'folder':
        return <Folder className="h-5 w-5" />;
      case 'manual':
        return <Book className="h-5 w-5" />;
      case 'service':
        return <FileText className="h-5 w-5" />;
      case 'certification':
        return <Award className="h-5 w-5" />;
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      default:
        return <FileQuestion className="h-5 w-5" />;
    }
  };

  const getDocumentBadgeVariant = (type: string | undefined): "default" | "secondary" | "outline" | "destructive" => {
    switch (type) {
      case 'folder':
        return "secondary";
      case 'manual':
        return "secondary";
      case 'service':
        return "default";
      case 'certification':
        return "outline";
      case 'image':
        return "outline";
      default:
        return "outline";
    }
  };

  const translateDocumentType = (type: string | undefined): string => {
    switch (type) {
      case 'folder':
        return "Mappe";
      case 'manual':
        return "Brugermanual";
      case 'service':
        return "Servicehåndbog";
      case 'certification':
        return "Certifikat";
      case 'image':
        return "Billede";
      default:
        return "Andet";
    }
  };

  const getAccessLevelInfo = (doc: Document) => {
    if ((doc.viewRoles && doc.viewRoles.length > 0) || (doc.viewUsers && doc.viewUsers.length > 0)) {
      return {
        icon: <Lock className="h-4 w-4 text-amber-500" />,
        text: 'Begrænset adgang'
      };
    }
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
      onDocumentAdd({
        ...newDocument,
        accessLevel: "public" as const
      });
    }
    setIsDialogOpen(false);
    setUploadToFolderId(undefined);
  };

  const handleSaveDocuments = (newDocuments: Document[]) => {
    if (onDocumentsAdd) {
      onDocumentsAdd(newDocuments.map(d => ({ ...d, accessLevel: "public" as const })));
    }
    setIsDialogOpen(false);
    setUploadToFolderId(undefined);
  };

  const handleCreateFolder = (folderName: string) => {
    if (!onDocumentAdd) return;
    const folderId = `folder-${Date.now()}`;
    const folderDoc: Document = {
      id: folderId,
      title: folderName,
      type: 'folder',
      fileName: '',
      fileUrl: `folder://${folderId}`,
      uploadedAt: new Date().toISOString(),
      uploadDate: new Date().toISOString(),
      accessLevel: 'public',
    };
    onDocumentAdd(folderDoc);
    setIsFolderDialogOpen(false);
    toast({
      title: "Mappe oprettet",
      description: `"${folderName}" er blevet oprettet.`,
    });
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
    if (isFolder(doc)) return;
    try {
      if (doc.fileUrl.startsWith('blob:') || doc.fileUrl.startsWith('http')) {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = doc.title || doc.fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Dokument åbnet",
          description: `Dokumentet '${doc.title}' åbnes i en ny fane.`,
        });
      } else {
        window.open(doc.fileUrl, '_blank');
        toast({
          title: "Dokument åbnet",
          description: `Dokumentet '${doc.title}' åbnes i en ny fane.`,
        });
      }
    } catch (error) {
      toast({
        title: "Fejl ved download",
        description: "Dokumentadressen er ikke gyldig. Kontakt venligst administratoren.",
        variant: "destructive"
      });
    }
  };

  const renderDocumentRow = (document: Document) => {
    const canView = canViewDocument(document);
    const canDownload = canDownloadDocument(document);
    const accessInfo = getAccessLevelInfo(document);
    
    if (!canView) return null;

    return (
      <div 
        key={document.id} 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-start gap-3 mb-3 sm:mb-0 min-w-0 flex-1">
          <div className="mt-1 text-primary shrink-0">
            {getDocumentIcon(document.type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium truncate">{document.title}</h4>
              <Badge variant={getDocumentBadgeVariant(document.type)}>
                {translateDocumentType(document.type)}
              </Badge>
              <div className="flex items-center shrink-0" title={accessInfo.text}>
                {accessInfo.icon}
              </div>
            </div>
            {document.description && (
              <p className="text-sm text-muted-foreground mb-1">{document.description}</p>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 mr-1 shrink-0" />
              <span>Uploadet: {new Date(document.uploadDate || document.uploadedAt).toLocaleDateString('da-DK')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
          {canDownload && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => handleDocumentDownload(document)}
            >
              <Download className="h-4 w-4" />
              <span>Hent</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  const folderOptions = folders.map(f => ({ id: f.id, title: f.title }));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Dokumentation</CardTitle>
          <CardDescription>
            Brugermanualer, servicehåndbøger, billeder og mapper
          </CardDescription>
        </div>
        {canUpload && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Folder className="h-4 w-4" />
                  Opret mappe
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Opret ny mappe</h3>
                  <p className="text-sm text-muted-foreground">
                    Opret en mappe for at organisere dokumenter og billeder, f.eks. &quot;Billeder af maskine&quot;.
                  </p>
                  <FolderCreateForm
                    onSave={handleCreateFolder}
                    onCancel={() => setIsFolderDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setUploadToFolderId(undefined); }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  Upload dokument(er)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DocumentUploadForm 
                  onSave={handleSaveDocument}
                  onSaveMultiple={onDocumentsAdd ? handleSaveDocuments : undefined}
                  onCancel={() => { setIsDialogOpen(false); setUploadToFolderId(undefined); }}
                  folders={folderOptions}
                  defaultFolderId={uploadToFolderId}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-4">
            {/* Folders with their documents */}
            {folders.map(folder => {
              const folderDocs = sortedDocuments.filter(d => d.folderId === folder.id);
              const isExpanded = expandedFolders.has(folder.id);
              const canViewFolder = canViewDocument(folder);
              if (!canViewFolder) return null;

              return (
                <div key={folder.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-medium truncate">{folder.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {folderDocs.length} fil{folderDocs.length !== 1 ? 'er' : ''}
                      </Badge>
                    </div>
                    {canUpload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); openUploadToFolder(folder.id); }}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload her
                      </Button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="p-2 space-y-2">
                      {folderDocs.length > 0 ? (
                        folderDocs.map(doc => renderDocumentRow(doc))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          Ingen filer i mappen endnu. Klik &quot;Upload her&quot; for at tilføje billeder eller dokumenter.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root documents (no folder) */}
            {sortedDocuments.filter(d => !d.folderId).map(doc => renderDocumentRow(doc))}

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
            <p className="text-muted-foreground mb-2">Ingen dokumentation fundet</p>
            {canUpload && (
              <p className="text-sm text-muted-foreground">
                Opret en mappe (f.eks. &quot;Billeder af maskine&quot;) og upload derefter flere billeder på én gang.
              </p>
            )}
          </div>
        )}
      </CardContent>

      {selectedDocument && (
        <DocumentPermissionsDialog
          document={selectedDocument}
          isOpen={isPermissionsDialogOpen}
          onClose={() => setIsPermissionsDialogOpen(false)}
          onSave={(permissions) => {
            if (onDocumentUpdate && selectedDocument) {
              onDocumentUpdate({ ...selectedDocument, ...permissions });
            }
            setIsPermissionsDialogOpen(false);
          }}
        />
      )}
    </Card>
  );
};

export default MachineDocuments;
