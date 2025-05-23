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
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUploadFormProps {
  onSave: (document: Document) => void;
  onCancel: () => void;
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
  'image/png'
];

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ 
  onSave, 
  onCancel 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formSchema = z.object({
    title: z.string().min(2, "Titlen skal være mindst 2 tegn."),
    type: z.enum(["manual", "service", "certification", "other"]),
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
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Filen er for stor. Maksimal størrelse er 10MB.",
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Filtypen er ikke understøttet. Tilladte formater: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG",
      });
      return;
    }

    setSelectedFile(file);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg venligst en fil at uploade.",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Here you would typically upload the file to your server/storage
      // For now, we'll create a mock URL
      const mockFileUrl = URL.createObjectURL(selectedFile);

      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        title: values.title,
        type: values.type,
        fileUrl: mockFileUrl,
        url: mockFileUrl,
        description: values.description,
        uploadedAt: new Date().toISOString(),
        uploadDate: new Date().toISOString(),
        fileName: selectedFile.name,
        uploadedBy: 'Current User',
        accessPermissions: ['admin', 'mechanic', 'technician'],
        accessLevel: 'public',
      };
      
      onSave(newDocument);
      
      toast({
        title: "Dokument uploadet",
        description: "Dokumentet er blevet tilføjet til maskinen.",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl under upload af dokumentet.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Upload nyt dokument</div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl>
                  <Input placeholder="Indtast dokumentets titel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dokumenttype</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
                    <SelectItem value="other">Andet</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Dokument</FormLabel>
            <div 
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
              
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Klik her eller træk en fil hertil</p>
                  <p className="text-sm text-muted-foreground">
                    Understøtter PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG op til 10MB
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
                    placeholder="Kort beskrivelse af dokumentet" 
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
              Dokumenter skal være i et af følgende formater: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG
              og må ikke overstige 10MB.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuller
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploader..." : "Upload dokument"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DocumentUploadForm;
