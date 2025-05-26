import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "@/components/ui/use-toast";
import { Machine, Equipment, EquipmentType, Model3D, type Location as MachineLocation, MachineStatus, Task, MaintenanceSchedule } from '@/types';
import { PlusCircle, Trash2, Upload, Image, Boxes } from 'lucide-react';
import LocationEditSection from './LocationEditSection';
import ImageUploadBox from '@/components/ImageUploadBox';
import { equipmentTranslations } from '@/utils/equipmentTranslations';
import { addDays } from 'date-fns';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
  Select as UISelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

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
  name: z.string().min(1, "Navn er påkrævet"),
  model: z.string().min(1, "Model er påkrævet"),
  serialNumber: z.string().min(1, "Serienummer er påkrævet"),
  status: z.enum(["active", "maintenance", "inactive"] as const),
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
      specifications: {},
      images: []
    }
  ]);
  const [images, setImages] = useState<string[]>([]);
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipmentType, setNewEquipmentType] = useState<EquipmentType>("truck");
  const [newEquipmentModel, setNewEquipmentModel] = useState("");
  const [location, setLocation] = useState<string | MachineLocation | undefined>("Hovedkvarter");
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | undefined>({
    lat: 55.676098,
    lng: 12.568337
  });
  const [newSpec, setNewSpec] = useState<{ value: string, label: string } | null>(null);
  const [newSpecInput, setNewSpecInput] = useState("");
  const [autoFocusSpecKey, setAutoFocusSpecKey] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      model: "",
      serialNumber: "",
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
    
    const updatedEquipment = equipment.map(equip => ({
      ...equip,
      images: equip === equipment[0] ? [...images] : equip.images
    }));
    
    const initialTasks: Task[] = [];
    const defaultSchedules: MaintenanceSchedule[] = [];
    
    const newMachine: Machine = {
      id: `machine-${Date.now()}`,
      name: values.name,
      model: values.model,
      serialNumber: values.serialNumber,
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
      editPermissions: ['admin', 'mechanic', 'technician'],
      year: undefined,
      qrCode: '',
      brand: '',
    };
    
    onSave(newMachine);
    
    toast({
      title: "Maskine oprettet",
      description: "Maskinen er blevet oprettet.",
    });
  };

  const commonSpecifications = [
    "Motor",
    "Vægt",
    "Kapacitet",
    "Brændstofforbrug",
    "Effekt",
    "Hastighed",
    "Dimensioner",
    "Materiale",
    "Arbejdstemperatur",
    "Tryk",
    "Spænding",
    "Strømstyrke",
    "Frekvens",
    "Effektivitet",
    "Støjniveau",
    "Garanti",
    "Vedligeholdelsesinterval",
    "Driftstimer",
    "Producent",
    "Modelår"
  ];

  const specificationOptions = commonSpecifications.map(spec => ({
    value: spec,
    label: spec
  }));

  const handleSpecificationChange = (equipmentIndex: number, oldKey: string, newKey: string, value: string) => {
    const updatedEquipment = [...equipment];
    const currentSpecs = updatedEquipment[equipmentIndex].specifications || {};
    const { [oldKey]: removed, ...rest } = currentSpecs;
    
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications: {
        ...rest,
        [newKey]: value
      }
    };
    
    setEquipment(updatedEquipment);
  };

  const addSpecification = (equipmentIndex: number, selectedOption: { value: string, label: string } | null) => {
    if (!selectedOption) return;
    const updatedEquipment = [...equipment];
    const currentSpecs = updatedEquipment[equipmentIndex].specifications || {};
    if (currentSpecs[selectedOption.value] !== undefined) {
      toast({
        variant: "destructive",
        title: "Specifikationen findes allerede",
        description: `Specifikationen '${selectedOption.value}' er allerede tilføjet.`,
      });
      return;
    }
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications: {
        ...currentSpecs,
        [selectedOption.value]: ""
      }
    };
    setEquipment(updatedEquipment);
    setAutoFocusSpecKey(selectedOption.value);
  };

  const removeSpecification = (equipmentIndex: number, key: string) => {
    const updatedEquipment = [...equipment];
    const currentSpecs = updatedEquipment[equipmentIndex].specifications || {};
    const { [key]: removed, ...rest } = currentSpecs;
    
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
      specifications: {},
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
    setModels3D(models3D.filter(model => model.thumbnailUrl !== url));
    toast({
      title: "Billede fjernet",
      description: "Billedet er blevet fjernet fra maskinen.",
    });
  };

  const getEquipmentTypeName = (type: EquipmentType): string => {
    return equipmentTranslations[type] || type;
  };

  const equipmentTypes = Object.entries(equipmentTranslations);

  const handleLocationChange = (newLocation: string | MachineLocation | undefined, newCoordinates: {lat: number; lng: number} | undefined) => {
    setLocation(newLocation);
    setCoordinates(newCoordinates);
  };

  const handleNewSpecification = (equipmentIndex: number, value: string) => {
    if (value.trim() === '') return;
    
    const updatedEquipment = [...equipment];
    const specifications = { ...updatedEquipment[equipmentIndex].specifications };
    specifications[value] = '';
    
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications
    };
    
    setEquipment(updatedEquipment);
    setNewSpecInput('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-container py-8">
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
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serienummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Maskinens serienummer" {...field} />
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
                    <UISelect
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="maintenance">Vedligeholdelse</SelectItem>
                        <SelectItem value="inactive">Inaktiv</SelectItem>
                      </SelectContent>
                    </UISelect>
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
                        <UISelect
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
                        </UISelect>
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
                            {Object.entries(equip.specifications as Record<string, string>).map(([key, value], specIndex) => (
                              <div key={`${key}-${specIndex}`} className="flex items-center gap-2">
                                <div className="w-1/3">
                                  <CreatableSelect
                                    options={specificationOptions}
                                    value={{ value: key, label: key }}
                                    onChange={(newValue) => {
                                      if (newValue) {
                                        handleSpecificationChange(index, key, newValue.value, value);
                                      }
                                    }}
                                    isSearchable
                                    isClearable
                                    placeholder="Vælg eller skriv specifikation..."
                                    classNamePrefix="react-select"
                                    formatCreateLabel={(inputValue) => `Opret "${inputValue}"`}
                                    isValidNewOption={(inputValue) => inputValue.length > 0}
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        minHeight: '36px',
                                        height: '36px'
                                      }),
                                      input: (base) => ({
                                        ...base,
                                        margin: '0px',
                                        padding: '0px'
                                      }),
                                      valueContainer: (base) => ({
                                        ...base,
                                        margin: '0px',
                                        padding: '0px 8px'
                                      }),
                                      menu: (base) => ({
                                        ...base,
                                        zIndex: 99999,
                                        maxHeight: '200px'
                                      }),
                                      menuList: (base) => ({
                                        ...base,
                                        maxHeight: '200px'
                                      }),
                                      menuPortal: base => ({ ...base, zIndex: 99999 })
                                    }}
                                    menuPortalTarget={typeof window !== 'undefined' ? window.document.body : undefined}
                                    menuPosition="fixed"
                                    onCreateOption={(inputValue) => {
                                      addSpecification(index, { value: inputValue, label: inputValue });
                                    }}
                                  />
                                </div>
                                <Input 
                                  value={value} 
                                  onChange={(e) => handleSpecificationChange(index, key, key, e.target.value)}
                                  className="w-full"
                                  placeholder="Værdi"
                                  autoFocus={autoFocusSpecKey === key}
                                  onBlur={() => setAutoFocusSpecKey(null)}
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
                            <div className="mt-2">
                              <CreatableSelect
                                options={specificationOptions}
                                onChange={(selected) => {
                                  if (selected) {
                                    addSpecification(index, selected);
                                  }
                                }}
                                isSearchable
                                isClearable
                                placeholder="Tilføj eller skriv ny specifikation..."
                                classNamePrefix="react-select"
                                formatCreateLabel={(inputValue) => `Opret "${inputValue}"`}
                                isValidNewOption={(inputValue) => inputValue.length > 0}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: '36px',
                                    height: '36px'
                                  }),
                                  input: (base) => ({
                                    ...base,
                                    margin: '0px',
                                    padding: '0px'
                                  }),
                                  valueContainer: (base) => ({
                                    ...base,
                                    margin: '0px',
                                    padding: '0px 8px'
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 99999,
                                    maxHeight: '200px'
                                  }),
                                  menuList: (base) => ({
                                    ...base,
                                    maxHeight: '200px'
                                  }),
                                  menuPortal: base => ({ ...base, zIndex: 99999 })
                                }}
                                menuPortalTarget={typeof window !== 'undefined' ? window.document.body : undefined}
                                menuPosition="fixed"
                                onCreateOption={(inputValue) => {
                                  addSpecification(index, { value: inputValue, label: inputValue });
                                }}
                              />
                            </div>
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
                        {models3D.some(model => model.thumbnailUrl === img) && (
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
      </main>
    </div>
  );
};

export default MachineAddForm;
