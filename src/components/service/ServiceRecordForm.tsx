
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Wrench } from "lucide-react";
import { EquipmentType, ServiceRecord } from '@/types';
import { useAuth } from '@/hooks/useAuth';

// Form schema for service record
const serviceFormSchema = z.object({
  equipmentType: z.enum(["truck", "crane", "winch", "hooklift"]),
  description: z.string().min(5, { message: "Beskrivelsen skal være mindst 5 tegn." }),
  issues: z.string().optional(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceRecordFormProps {
  machineId: string;
  onSubmit: (data: ServiceFormValues) => void;
}

const ServiceRecordForm: React.FC<ServiceRecordFormProps> = ({
  machineId,
  onSubmit,
}) => {
  const { user } = useAuth();
  
  // Initialize form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      equipmentType: "truck",
      description: "",
      issues: "",
    },
  });

  const handleSubmit = (values: ServiceFormValues) => {
    // Call the parent onSubmit function with the form values
    onSubmit(values);
    
    // Reset the form
    form.reset();
    
    // Show success toast
    toast({
      title: "Service registreret",
      description: "Serviceregistreringen er blevet gemt.",
    });
  };

  // Get the equipment type name in Danish
  const getEquipmentTypeName = (type: EquipmentType): string => {
    switch (type) {
      case 'truck': return 'Lastbil';
      case 'crane': return 'Kran';
      case 'winch': return 'Spil';
      case 'hooklift': return 'Kroghejs';
      default: return type;
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center space-x-2">
        <Wrench className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Registrer Service</h3>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="equipmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Udstyrstype</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg udstyr" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="truck">{getEquipmentTypeName('truck')}</SelectItem>
                    <SelectItem value="crane">{getEquipmentTypeName('crane')}</SelectItem>
                    <SelectItem value="winch">{getEquipmentTypeName('winch')}</SelectItem>
                    <SelectItem value="hooklift">{getEquipmentTypeName('hooklift')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beskrivelse af service</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Beskriv det udførte arbejde..." 
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="issues"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Problemer/Bemærkninger (valgfrit)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Angiv eventuelle problemer eller bemærkninger..." 
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">
            Registrer Service
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ServiceRecordForm;
