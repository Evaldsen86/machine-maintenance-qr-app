
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "@/components/ui/use-toast";
import { OilType, EquipmentType } from '@/types';
import { PlusCircle, Trash2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, { message: "Navn skal være mindst 2 tegn" }),
  type: z.string().min(1, { message: "Type skal angives" }),
  viscosity: z.string().min(1, { message: "Viskositet skal angives" }),
  specification: z.string().optional(),
  quantity: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OilAddFormProps {
  onSave: (values: OilType) => void;
  onCancel: () => void;
}

const OilAddForm: React.FC<OilAddFormProps> = ({
  onSave,
  onCancel,
}) => {
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<EquipmentType[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      viscosity: "",
      specification: "",
      quantity: "",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const newOil: OilType = {
      id: `oil-${Date.now()}`,
      name: values.name,
      type: values.type,
      viscosity: values.viscosity,
      specification: values.specification || "",
      specifications: values.specification || "",  // Use string format to match the type
      quantity: values.quantity,
      notes: values.notes,
      applicableEquipment: selectedEquipmentTypes.length > 0 ? selectedEquipmentTypes : undefined,
      lastChanged: new Date().toISOString(),
      nextChange: "",  // Will be set when oil is changed
    };
    
    onSave(newOil);
    
    toast({
      title: "Olie tilføjet",
      description: "Olien er blevet tilføjet til maskinen.",
    });
  };

  // Handle equipment type toggle
  const toggleEquipmentType = (type: EquipmentType) => {
    setSelectedEquipmentTypes(current => 
      current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type]
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navn</FormLabel>
              <FormControl>
                <Input placeholder="Oliens navn" {...field} />
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
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Input placeholder="Oliens type" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="viscosity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Viskositet</FormLabel>
              <FormControl>
                <Input placeholder="Oliens viskositet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specifikation</FormLabel>
              <FormControl>
                <Input placeholder="Oliens specifikation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mængde</FormLabel>
              <FormControl>
                <Input placeholder="Oliens mængde" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Noter</FormLabel>
              <FormControl>
                <Textarea placeholder="Yderligere noter om olien" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel>Anvendeligt udstyr</FormLabel>
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button" 
              variant={selectedEquipmentTypes.includes('truck') ? "default" : "outline"}
              onClick={() => toggleEquipmentType('truck')}
              size="sm"
            >
              Lastbil
            </Button>
            <Button 
              type="button" 
              variant={selectedEquipmentTypes.includes('crane') ? "default" : "outline"}
              onClick={() => toggleEquipmentType('crane')}
              size="sm"
            >
              Kran
            </Button>
            <Button 
              type="button" 
              variant={selectedEquipmentTypes.includes('winch') ? "default" : "outline"}
              onClick={() => toggleEquipmentType('winch')}
              size="sm"
            >
              Spil
            </Button>
            <Button 
              type="button" 
              variant={selectedEquipmentTypes.includes('hooklift') ? "default" : "outline"}
              onClick={() => toggleEquipmentType('hooklift')}
              size="sm"
            >
              Kroghejs
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuller
          </Button>
          <Button type="submit">Gem olie</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default OilAddForm;
