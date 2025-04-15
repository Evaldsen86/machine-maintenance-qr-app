import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from "@/components/ui/use-toast";
import { Machine, Equipment, EquipmentType, UserRole, Model3D } from '@/types';
import { PlusCircle, Trash2, Upload, Image, Users, Boxes } from 'lucide-react';
import LocationEditSection from './LocationEditSection';
import ImageUploadBox from '@/components/ImageUploadBox';
import { equipmentTranslations } from '@/utils/equipmentTranslations';

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
import {
  ScrollArea
} from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Checkbox
} from "@/components/ui/checkbox";
import { debug3DModel } from '@/utils/model3DUtils';

const formSchema = z.object({
  name: z.string().min(2, { message: "Navn skal være mindst 2 tegn" }),
  model: z.string().min(2, { message: "Model skal være mindst 2 tegn" }),
  status: z.enum(["active", "maintenance", "inactive", "repair"]),
});

type FormValues = z.infer<typeof formSchema>;

interface MachineEditFormProps {
  machine: Machine;
  onSave: (values: any) => void;
  onCancel: () => void;
}

const availableRoles: {role: UserRole, label: string}[] = [
  {role: 'driver', label: 'Chauffør'},
  {role: 'mechanic', label: 'Mekaniker'},
  {role: 'technician', label: 'Tekniker'},
  {role: 'blacksmith', label: 'Smed'},
  {role: 'customer', label: 'Kunde'},
  {role: 'viewer', label: 'Bruger (visning)'},
];

const MachineEditForm: React.FC<MachineEditFormProps> = ({
  machine,
  onSave,
  onCancel,
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>(machine.equipment || []);
  const [images, setImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(machine.equipment[0]?.images || []);
  const [imageUrl, setImageUrl] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipmentType, setNewEquipmentType] = useState<EquipmentType>("truck");
  const [newEquipmentModel, setNewEquipmentModel] = useState("");
  const [location, setLocation] = useState<string | undefined>(
    typeof machine.location === 'string' ? machine.location : 
    machine.location ? machine.location.name : undefined
  );
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | undefined>(machine.coordinates);
  const [permissionsRoles, setPermissionsRoles] = useState<UserRole[]>(machine.editPermissions || ['admin', 'mechanic', 'technician']);
  const [models3D, setModels3D] = useState<Model3D[]>(machine.models3D || []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: machine.name,
      model: machine.model,
      status: machine.status,
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
    
    console.log("Saving machine with 3D models:", models3D);
    const updatedMachine = {
      ...machine,
      ...values,
      equipment: equipment.map(equip => ({
        ...equip,
        images: equip === equipment[0] ? [...existingImages, ...images] : equip.images
      })),
      location,
      coordinates,
      editPermissions: permissionsRoles,
      models3D: models3D
    };
    
    onSave(updatedMachine);
    
    toast({
      title: "Ændringer gemt",
      description: "Maskinen er blevet opdateret.",
    });
  };

  const handleLocationChange = (newLocation: string | undefined, newCoordinates: {lat: number; lng: number} | undefined) => {
    setLocation(newLocation);
    setCoordinates(newCoordinates);
  };

  const handleSpecificationChange = (equipmentIndex: number, oldKey: string, newKey: string, value: string) => {
    const updatedEquipment = [...equipment];
    const specifications = { ...updatedEquipment[equipmentIndex].specifications };
    
    if (oldKey !== newKey) {
      delete specifications[oldKey];
      specifications[newKey] = value;
    } else {
      specifications[oldKey] = value;
    }
    
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications
    };
    
    setEquipment(updatedEquipment);
  };

  const addSpecification = (equipmentIndex: number) => {
    const updatedEquipment = [...equipment];
    
    updatedEquipment[equipmentIndex] = {
      ...updatedEquipment[equipmentIndex],
      specifications: {
        ...updatedEquipment[equipmentIndex].specifications,
        "Ny specifikation": ""
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
    if (equipment.length <= 1) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal have mindst et udstyr på maskinen.",
      });
      return;
    }
    
    const updatedEquipment = [...equipment];
    updatedEquipment.splice(index, 1);
    setEquipment(updatedEquipment);
  };

  const addImage = () => {
    if (imageUrl && !images.includes(imageUrl) && !existingImages.includes(imageUrl)) {
      setImages([...images, imageUrl]);
      setImageUrl("");
      toast({
        title: "Billede tilføjet",
        description: "Billedet er blevet tilføjet til maskinen.",
      });
    } else if (images.includes(imageUrl) || existingImages.includes(imageUrl)) {
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
    if (imageUrl && !images.includes(imageUrl) && !existingImages.includes(imageUrl)) {
      setImages([...images, imageUrl]);
      toast({
        title: "Billede tilføjet",
        description: "Det uploadede billede er blevet tilføjet til maskinen.",
      });
    }
  };

  const handle3DModelUpload = (model: Model3D) => {
    console.log("3D model uploaded in MachineEditForm:", model);
    debug3DModel(model);
    
    setModels3D(prevModels => {
      const existingModelIndex = prevModels.findIndex(m => m.thumbnail === model.thumbnail);
      
      if (existingModelIndex >= 0) {
        const updatedModels = [...prevModels];
        updatedModels[existingModelIndex] = model;
        return updatedModels;
      } else {
        return [...prevModels, model];
      }
    });
    
    toast({
      title: "3D model tilføjet",
      description: "3D-modellen er blevet tilføjet til maskinen og vil være tilgængelig efter du gemmer ændringerne.",
      duration: 5000
    });
  };

  const removeImage = (url: string) => {
    setImages(images.filter(img => img !== url));
    
    setModels3D(prevModels => prevModels.filter(model => model.thumbnail !== url));
    
    toast({
      title: "Billede fjernet",
      description: "Billedet er blevet fjernet fra maskinen.",
    });
  };

  const handleDeleteExistingImage = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
    
    setModels3D(prevModels => prevModels.filter(model => model.thumbnail !== url));
    
    toast({
      title: "Eksisterende billede fjernet",
      description: "Det eksisterende billede er blevet fjernet fra maskinen.",
    });
  };

  const togglePermissionRole = (role: UserRole) => {
    if (role === 'admin') return;
    
    setPermissionsRoles(current => {
      if (current.includes(role)) {
        return current.filter(r => r !== role);
      } else {
        return [...current, role];
      }
    });
  };

  const equipmentTypes = Object.entries(equipmentTranslations);

  const getEquipmentTypeName = (type: EquipmentType): string => {
    return equipmentTranslations[type] || type;
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Redigér Maskine</DialogTitle>
        <DialogDescription>
          Opdatér maskinens detaljer herunder.
        </DialogDescription>
      </DialogHeader>

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
                    <SelectItem value="repair">Reparation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <LocationEditSection 
            machine={machine} 
            onChange={handleLocationChange} 
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <Users size={18} />
                Redigeringstilladelser
              </CardTitle>
              <CardDescription>
                Vælg hvilke roller der kan redigere denne maskine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <Checkbox id="admin" checked disabled />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="admin"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Administrator
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Har altid fuld adgang
                    </p>
                  </div>
                </div>
                
                {availableRoles.map(({role, label}) => (
                  <div key={role} className="flex items-start space-x-2">
                    <Checkbox 
                      id={role} 
                      checked={permissionsRoles.includes(role)}
                      onCheckedChange={() => togglePermissionRole(role)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={role}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                      <ScrollArea className="h-[200px] pr-4">
                        <div className="space-y-3 pr-2">
                          {Object.entries(equip.specifications).map(([key, value], specIndex) => (
                            <div key={`${key}-${specIndex}`} className="flex items-center gap-2">
                              <Input 
                                value={key} 
                                onChange={(e) => handleSpecificationChange(index, key, e.target.value, value)}
                                className="w-1/3" 
                                placeholder="Specifikationsnavn"
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
                        </div>
                      </ScrollArea>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addSpecification(index)}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Tilføj Specifikation
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-md font-medium">Billeder og 3D Modeller</h3>
            
            <div className="space-y-3">
              <ImageUploadBox 
                onUpload={handleImageUpload}
                onUpload3D={handle3DModelUpload}
                onDeleteExistingImage={handleDeleteExistingImage}
                existingImages={existingImages}
              />
              
              {images.map((img, index) => (
                <div key={`new-${index}`} className="flex items-center gap-2">
                  <div className="w-16 h-16 bg-muted rounded flex-shrink-0">
                    <img src={img} alt="Machine" className="w-full h-full object-cover rounded" />
                  </div>
                  <span className="truncate flex-1 text-sm">{img}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => removeImage(img)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
              
              {models3D.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Boxes className="h-4 w-4 mr-2" />
                      3D Modeller ({models3D.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2">
                      {models3D.map((model, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{model.fileName}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {model.fileType === '3d-glb' ? 'GLB' : 'USDZ'}
                            </span>
                          </div>
                          {model.thumbnail && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Tilknyttet billede</span>
                              <div className="w-8 h-8 rounded overflow-hidden">
                                <img src={model.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuller
            </Button>
            <Button type="submit">Gem ændringer</Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
};

export default MachineEditForm;
