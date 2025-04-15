import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "@/components/ui/use-toast";
import { Machine, Equipment, EquipmentType, Model3D } from '@/types';
import { PlusCircle, Trash2, Upload, Image, Boxes } from 'lucide-react';
import LocationEditSection from './LocationEditSection';
import ImageUploadBox from '@/components/ImageUploadBox';
import { equipmentTranslations } from '@/utils/equipmentTranslations';
import { addDays } from 'date-fns';

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
import {
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(2, { message: "Navn skal være mindst 2 tegn" }),
  model: z.string().min(2, { message: "Model skal være mindst 2 tegn" }),
  status: z.enum(["active", "maintenance", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

interface MachineAddFormProps {
  onSave: (values: Machine) => void;
  onCancel: () => void;
}

const MachineAddForm: React.FC<MachineAddFormProps> = ({
  onSave,
  onCancel,
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>([
    {
      id: `equipment-${Date.now()}`,
      type: "truck",
      model: "Standard Model",
      specifications: {
        "Specifikation": ""
      },
      images: []
    }
  ]);
  const [images, setImages] = useState<string[]>([]);
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipmentType, setNewEquipmentType] = useState<EquipmentType>("truck");
  const [newEquipmentModel, setNewEquipmentModel] = useState("");
  const [location, setLocation] = useState<string | undefined>("Hovedkvarter");
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | undefined>({
    lat: 55.676098,
    lng: 12.568337
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      model: "",
      status: "active",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (equipment.length === 0) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal have mindst et udstyr på maskinen.",
      });
      return;
    }
    
    const defaultSchedules = equipment.map(equip => {
      let interval = 'monthly';
      let days = 30;
      
      if (equip.type === 'crane') {
        interval = 'biweekly';
        days = 14;
      } else if (equip.type === 'truck') {
        interval = 'monthly';
        days = 30;
      } else if (equip.type === 'winch') {
        interval = 'quarterly';
        days = 90;
      }
      
      return {
        id: `schedule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        equipmentType: equip.type,
        taskDescription: `Regelmæssig vedligeholdelse af ${equip.type}`,
        interval: interval as 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom',
        intervalUnit: 'days' as 'days' | 'weeks' | 'months' | 'years',
        customInterval: days,
        nextDue: addDays(new Date(), days).toISOString(),
      };
    });
    
    const initialTasks = equipment.map(equip => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: `Vedligeholdelse af ${equip.type}`,
      description: `Rutine vedligeholdelse af ${equip.type}`,
      dueDate: addDays(new Date(), equip.type === 'crane' ? 14 : equip.type === 'winch' ? 90 : 30).toISOString(),
      status: 'pending' as const,
      equipmentType: equip.type
    }));

    const updatedEquipment = equipment.map(eq => ({
      ...eq,
      images: [...eq.images, ...images],
      models3D: models3D.length > 0 ? models3D : undefined
    }));
    
    const newMachine: Machine = {
      id: `machine-${Date.now()}`,
      name: values.name,
      model: values.model,
      status: values.status,
      equipment: updatedEquipment,
      serviceHistory: [],
      lubricationHistory: [],
      tasks: initialTasks,
      location,
      coordinates,
      maintenanceSchedules: defaultSchedules,
      documents: [],
      oils: [],
      createdAt: new Date().toISOString(),
      editPermissions: ['admin', 'mechanic', 'technician']
    };
    
    onSave(newMachine);
    
    toast({
      title: "Maskine oprettet",
      description: "Maskinen er blevet oprettet.",
    });
  };

  const handleSpecificationChange = (equipmentIndex: number, oldKey: string, newKey: string, value: string) => {
    const updatedEquipment = [...equipment];
    const specifications = { ...updatedEquipment[equipmentIndex].specifications };
    
    if (oldKey === newKey) {
      specifications[oldKey] = value;
    } else {
      delete specifications[oldKey];
      specifications[newKey] = value;
    }
    
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications
    };
    
    setEquipment(updatedEquipment);
  };

  const addSpecification = (equipmentIndex: number, key: string) => {
    const updatedEquipment = [...equipment];
    
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications: {
        ...updatedEquipment[equipmentIndex].specifications,
        [key]: ""
      }
    };
    
    setEquipment(updatedEquipment);
  };

  const removeSpecification = (equipmentIndex: number, key: string) => {
    const updatedEquipment = [...equipment];
    const { [key]: removed, ...rest } = updatedEquipment[equipmentIndex].specifications;
    
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications: rest
    };
    
    setEquipment(updatedEquipment);
  };

  const clearSpecifications = (equipmentIndex: number) => {
    const updatedEquipment = [...equipment];
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications: {}
    };
    setEquipment(updatedEquipment);
  };

  const commonSpecifications = [
    "Engine",
    "Weight",
    "Capacity",
    "Fuel Consumption"
  ];

  const addEquipment = () => {
    if (!newEquipmentModel) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal angive en model for udstyret.",
      });
      return;
    }

    const newEquipment: Equipment = {
      id: `equipment-${Date.now()}`,
      type: newEquipmentType,
      model: newEquipmentModel,
      specifications: {
        "Specifikation": ""
      },
      images: []
    };

    setEquipment([...equipment, newEquipment]);
    setNewEquipmentModel("");
    setShowAddEquipment(false);
  };

  const removeEquipment = (index: number) => {
    const updatedEquipment = [...equipment];
    updatedEquipment.splice(index, 1);
    setEquipment(updatedEquipment);
  };

  const addImage = () => {
    if (imageUrl && !images.includes(imageUrl)) {
      setImages([...images, imageUrl]);
      setImageUrl("");
      toast({
        title: "Billede tilføjet",
        description: "Billedet er blevet tilføjet til maskinen.",
      });
    } else if (images.includes(imageUrl)) {
      toast({
        variant: "destructive",
        title: "Duplikat billede",
        description: "Dette billede er allerede tilføjet.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Ugyldig URL",
        description: "Indtast venligst en gyldig URL til billedet.",
      });
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    if (imageUrl && !images.includes(imageUrl)) {
      setImages([...images, imageUrl]);
      toast({
        title: "Billede tilføjet",
        description: "Det uploadede billede er blevet tilføjet til maskinen.",
      });
    }
  };

  const handle3DModelUpload = (model: Model3D) => {
    setModels3D(prev => [...prev, model]);
    toast({
      title: "3D model tilføjet",
      description: "3D-modellen er blevet tilføjet til maskinen.",
    });
  };

  const removeImage = (url: string) => {
    setImages(images.filter(img => img !== url));
    setModels3D(models3D.filter(model => model.thumbnail !== url));
    toast({
      title: "Billede fjernet",
      description: "Billedet er blevet fjernet fra maskinen.",
    });
  };

  const getEquipmentTypeName = (type: EquipmentType): string => {
    return equipmentTranslations[type] || type;
  };

  const equipmentTypes = Object.entries(equipmentTranslations);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Tilføj Ny Maskine</h2>
        <p className="text-muted-foreground">
          Indtast detaljer for den nye maskine herunder.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Navn</FormLabel>
                <FormControl>
                  <Input placeholder="Maskinens navn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Maskinens model" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="maintenance">Vedligeholdelse</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">Udstyr</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddEquipment(true)}
                className={showAddEquipment ? "hidden" : ""}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Tilføj Udstyr
              </Button>
            </div>

            {showAddEquipment && (
              <div className="border p-4 rounded-lg space-y-3">
                <h4 className="font-medium">Nyt Udstyr</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={newEquipmentType}
                      onValueChange={(value) => setNewEquipmentType(value as EquipmentType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-60">
                          {equipmentTypes.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input 
                      value={newEquipmentModel} 
                      onChange={(e) => setNewEquipmentModel(e.target.value)}
                      placeholder="Model"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddEquipment(false)}
                  >
                    Annuller
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addEquipment}
                  >
                    Tilføj
                  </Button>
                </div>
              </div>
            )}
            
            {equipment.length === 0 ? (
              <div className="text-center p-4 border border-dashed rounded-lg">
                <p className="text-muted-foreground">Ingen udstyr tilføjet endnu. Klik på "Tilføj Udstyr" for at begynde.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {equipment.map((equip, index) => (
                  <AccordionItem key={index} value={`equipment-${index}`}>
                    <div className="flex items-center justify-between">
                      <AccordionTrigger className="flex-1">
                        {getEquipmentTypeName(equip.type)} - {equip.model}
                      </AccordionTrigger>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeEquipment(index)}
                        className="h-8 mr-2"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <AccordionContent>
                      <div className="space-y-3">
                        {Object.entries(equip.specifications).map(([key, value], specIndex) => (
                          <div key={`${key}-${specIndex}`} className="flex items-center gap-2">
                            <Input 
                              value={key} 
                              onChange={(e) => handleSpecificationChange(index, key, e.target.value, value)}
                              className="w-1/3" 
                              placeholder="Specifikation"
                            />
                            <Input 
                              value={value} 
                              onChange={(e) => handleSpecificationChange(index, key, key, e.target.value)}
                              className="w-full"
                              placeholder="Værdi"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              onClick={() => removeSpecification(index, key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => clearSpecifications(index)}
                          className="mt-2"
                        >
                          Clear All Specifications
                        </Button>
                        <Select 
                          onValueChange={(value) => addSpecification(index, value)}
                          placeholder="Select a specification"
                        >
                          {commonSpecifications.map((spec) => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </Select>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-md font-medium">Billeder</h3>
            
            <div className="space-y-4">
              <ImageUploadBox 
                onUpload={handleImageUpload}
                onUpload3D={handle3DModelUpload} 
              />
              
              {images.map((img, index) => (
                <div key={`new-${index}`} className="flex items-center gap-2">
                  <div className="w-16 h-16 bg-muted rounded flex-shrink-0">
                    <img src={img} alt="Machine" className="w-full h-full object-cover rounded" />
                  </div>
                  <span className="truncate flex-1 text-sm">{img}</span>
                  <div className="flex gap-1 items-center">
                    {models3D.some(model => model.thumbnail === img) && (
                      <div className="bg-blue-500/70 text-white px-2 py-1 rounded text-xs flex items-center">
                        <Boxes className="h-3 w-3 mr-1" />
                        3D
                      </div>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeImage(img)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Billede URL" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addImage}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Tilføj
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuller
            </Button>
            <Button type="submit">Gem maskine</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MachineAddForm;
