
import React, { useState } from 'react';
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

interface DocumentUploadFormProps {
  onSave: (document: Document) => void;
  onCancel: () => void;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ 
  onSave, 
  onCancel 
}) => {
  const formSchema = z.object({
    title: z.string().min(2, "Titlen skal være mindst 2 tegn."),
    type: z.enum(["manual", "service", "certification", "other"]),
    fileUrl: z.string().url("Indtast en gyldig URL."),
    description: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "manual",
      fileUrl: "",
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // In a real app, the document would be uploaded to a server
    // For now we just create a new document object
    const newDocument: Document = {
      id: `doc-${Date.now()}`, // Generate a simple ID
      title: values.title,
      type: values.type as "manual" | "service" | "certification" | "other",
      fileUrl: values.fileUrl,
      url: values.fileUrl, // Set url same as fileUrl
      description: values.description,
      uploadedAt: new Date().toISOString(),
      uploadDate: new Date().toISOString(), // For backward compatibility
      fileName: values.fileUrl.split('/').pop() || `document-${Date.now()}.pdf`,
      uploadedBy: 'Current User',
      accessPermissions: ['admin', 'mechanic', 'technician'], // Default permissions
      accessLevel: 'public',
    };
    
    onSave(newDocument);
    
    toast({
      title: "Dokument uploadet",
      description: "Dokumentet er blevet tilføjet til maskinen.",
    });
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

          <FormField
            control={form.control}
            name="fileUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dokument URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/document.pdf" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuller
            </Button>
            <Button type="submit">Upload dokument</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DocumentUploadForm;
