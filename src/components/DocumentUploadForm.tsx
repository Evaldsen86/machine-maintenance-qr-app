import React, { useState, useRef } from 'react';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Document } from "@/types";
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, AlertCircle, Folder, ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentFolder {
  id: string;
  title: string;
}

interface DocumentUploadFormProps {
  onSave: (document: Document) => void;
  onSaveMultiple?: (documents: Document[]) => void;
  onCancel: () => void;
  /** Eksisterende mapper til valg ved upload */
  folders?: DocumentFolder[];
  /** Valgt mappe ved åbning (f.eks. når man klikker "Upload til mappe") */
  defaultFolderId?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ 
  onSave, 
  onSaveMultiple,
  onCancel,
  folders = [],
  defaultFolderId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadToFolderId, setUploadToFolderId] = useState<string | undefined>(defaultFolderId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const formSchema = z.object({
    title: z.string().optional(),
    type: z.enum(["manual", "service", "certification", "other", "image"]),
    description: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "manual",
      description: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "Filen for stor",
          description: `"${file.name}" er over 10MB og er sprunget over.`,
        });
        continue;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Filtype ikke understøttet",
          description: `"${file.name}" - Tilladte formater: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, WEBP, GIF`,
        });
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg mindst én fil at uploade.",
      });
      return;
    }

    try {
      setIsUploading(true);

      const documents: Document[] = [];
      const baseTitle = values.title?.trim() || '';
      const useFilenameAsTitle = selectedFiles.length > 1 || !baseTitle;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mockFileUrl = URL.createObjectURL(file);
        const docType = IMAGE_TYPES.includes(file.type) ? 'image' : (values.type || 'other');
        const title = useFilenameAsTitle 
          ? file.name.replace(/\.[^/.]+$/, '') 
          : (baseTitle + (selectedFiles.length > 1 ? ` (${i + 1})` : ''));

        const newDocument: Document = {
          id: `doc-${Date.now()}-${i}`,
          title,
          type: docType,
          fileUrl: mockFileUrl,
          url: mockFileUrl,
          description: values.description,
          uploadedAt: new Date().toISOString(),
          uploadDate: new Date().toISOString(),
          fileName: file.name,
          uploadedBy: user?.name || 'Bruger',
          accessPermissions: ['admin', 'mechanic', 'technician'],
          accessLevel: 'public',
          folderId: uploadToFolderId || undefined,
        };

        documents.push(newDocument);
      }

      if (onSaveMultiple && documents.length > 1) {
        onSaveMultiple(documents);
        toast({
          title: "Filer uploadet",
          description: `${documents.length} filer er blevet tilføjet.`,
        });
      } else {
        documents.forEach(doc => onSave(doc));
        toast({
          title: documents.length > 1 ? "Filer uploadet" : "Dokument uploadet",
          description: documents.length > 1 
            ? `${documents.length} filer er blevet tilføjet.`
            : "Dokumentet er blevet tilføjet til maskinen.",
        });
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl under upload.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Upload dokument(er)</div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {folders.length > 0 && (
            <div className="space-y-2">
              <FormLabel>Upload til mappe (valgfri)</FormLabel>
              <Select
                value={uploadToFolderId || 'none'}
                onValueChange={(v) => setUploadToFolderId(v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rod (ingen mappe)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Rod (ingen mappe)
                    </span>
                  </SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {f.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(selectedFiles.length === 0 || selectedFiles.length === 1) && (
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel {selectedFiles.length > 1 ? '(bruges ikke ved flere filer)' : ''}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={selectedFiles.length > 1 ? "Filnavne bruges som titler" : "Indtast dokumentets titel"} 
                      {...field} 
                      disabled={selectedFiles.length > 1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dokumenttype</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg dokumenttype" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">Brugermanual</SelectItem>
                    <SelectItem value="service">Servicehåndbog</SelectItem>
                    <SelectItem value="certification">Certifikat</SelectItem>
                    <SelectItem value="image">Billeder</SelectItem>
                    <SelectItem value="other">Andet</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Filer (flere valg muligt)</FormLabel>
            <div 
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.gif"
                multiple
              />
              
              {selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedFiles.length} fil(er) valgt</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto">
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-sm"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Klik her eller træk filer hertil</p>
                  <p className="text-sm text-muted-foreground">
                    Vælg én eller flere filer. PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, WEBP, GIF op til 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beskrivelse (valgfri)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Kort beskrivelse" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Du kan uploade flere billeder på én gang. Opret evt. en mappe først (f.eks. &quot;Billeder af maskine&quot;) og vælg den ved upload.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuller
            </Button>
            <Button type="submit" disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? "Uploader..." : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} fil(er)`}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DocumentUploadForm;
