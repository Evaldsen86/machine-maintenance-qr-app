import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/useAuth';
import { Course, Video, Machine, TruckBrand, TruckType, EquipmentAttachment } from '@/types';
import { toast } from "@/components/ui/use-toast";
import { Plus, X, GripVertical } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, "Titel er påkrævet"),
  description: z.string().optional(),
  category: z.string().min(1, "Kategori er påkrævet"),
});

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  videos: Video[];
  machines?: Machine[];
  existingCourse?: Course;
}

const CourseForm: React.FC<CourseFormProps> = ({
  isOpen,
  onClose,
  onSave,
  videos,
  machines = [],
  existingCourse
}) => {
  const { user } = useAuth();
  const [selectedVideos, setSelectedVideos] = useState<string[]>(existingCourse?.videos.map(v => v.id) || []);
  const [selectedTruckBrands, setSelectedTruckBrands] = useState<TruckBrand[]>(existingCourse?.truckBrands || []);
  const [selectedTruckTypes, setSelectedTruckTypes] = useState<TruckType[]>(existingCourse?.truckTypes || []);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentAttachment[]>(existingCourse?.equipmentAttachments || []);
  const [selectedMachines, setSelectedMachines] = useState<string[]>(existingCourse?.machineIds || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existingCourse?.title || '',
      description: existingCourse?.description || '',
      category: existingCourse?.category || '',
    },
  });

  useEffect(() => {
    if (existingCourse) {
      form.reset({
        title: existingCourse.title,
        description: existingCourse.description || '',
        category: existingCourse.category,
      });
      setSelectedVideos(existingCourse.videos.map(v => v.id));
      setSelectedTruckBrands(existingCourse.truckBrands || []);
      setSelectedTruckTypes(existingCourse.truckTypes || []);
      setSelectedEquipment(existingCourse.equipmentAttachments || []);
      setSelectedMachines(existingCourse.machineIds || []);
    } else {
      form.reset({
        title: '',
        description: '',
        category: '',
      });
      setSelectedVideos([]);
      setSelectedTruckBrands([]);
      setSelectedTruckTypes([]);
      setSelectedEquipment([]);
      setSelectedMachines([]);
    }
  }, [existingCourse, isOpen]);

  const categories = [
    'Kran',
    'Sideloader',
    'Lastbil checks',
    'Udstyr',
    'Sikkerhed',
    'Vedligeholdelse',
    'Andet'
  ];

  const truckBrands: TruckBrand[] = ['Scania', 'Volvo', 'Mercedes', 'Other'];
  const truckTypes: TruckType[] = [
    'tractor',
    'crane_with_lad',
    'hooklift',
    'zepro_lift',
    'garbage_truck',
    'water_truck',
    'sludge_sucker',
    'other'
  ];
  const equipmentTypes: EquipmentAttachment[] = [
    'crane',
    'winch',
    'boat_supports',
    'load_extender',
    'outriggers',
    'other'
  ];

  const selectedVideoObjects = videos.filter(v => selectedVideos.includes(v.id));

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (selectedVideos.length === 0) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg mindst én video til kurset.",
      });
      return;
    }

    try {
      const courseVideos = selectedVideoObjects.map((video, index) => ({
        ...video,
        order: index
      }));

      const course: Course = {
        id: existingCourse?.id || `course-${Date.now()}`,
        title: values.title,
        description: values.description,
        videos: courseVideos,
        category: values.category,
        equipmentAttachments: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        truckBrands: selectedTruckBrands.length > 0 ? selectedTruckBrands : undefined,
        truckTypes: selectedTruckTypes.length > 0 ? selectedTruckTypes : undefined,
        machineIds: selectedMachines.length > 0 ? selectedMachines : undefined,
        createdAt: existingCourse?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: existingCourse?.createdBy || user?.id,
      };

      onSave(course);
      
      form.reset();
      setSelectedVideos([]);
      setSelectedTruckBrands([]);
      setSelectedTruckTypes([]);
      setSelectedEquipment([]);
      setSelectedMachines([]);
      
      toast({
        title: existingCourse ? "Kursus opdateret" : "Kursus oprettet",
        description: `Kurset "${values.title}" er blevet ${existingCourse ? 'opdateret' : 'oprettet'}.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl under gemning af kurset.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingCourse ? 'Rediger Kursus' : 'Opret Kursus'}</DialogTitle>
          <DialogDescription>
            Opret eller rediger et kursus ved at vælge videoer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="F.eks. Komplet kran kursus"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Beskrivelse af kurset..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vælg kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Video Selection */}
          <div className="space-y-2">
            <Label>Videoer *</Label>
            <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-2">
              {videos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ingen videoer tilgængelige. Tilføj videoer først.
                </p>
              ) : (
                videos.map(video => (
                  <div key={video.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                      id={`video-${video.id}`}
                      checked={selectedVideos.includes(video.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVideos([...selectedVideos, video.id]);
                        } else {
                          setSelectedVideos(selectedVideos.filter(id => id !== video.id));
                        }
                      }}
                    />
                    <Label htmlFor={`video-${video.id}`} className="cursor-pointer flex-1 text-sm">
                      {video.title}
                    </Label>
                  </div>
                ))
              )}
            </div>
            {selectedVideos.length > 0 && (
              <div className="mt-2 p-2 bg-muted rounded">
                <p className="text-sm font-medium mb-2">Valgte videoer ({selectedVideos.length}):</p>
                <div className="space-y-1">
                  {selectedVideoObjects.map((video, index) => (
                    <div key={video.id} className="flex items-center gap-2 text-sm">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span>{index + 1}. {video.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link to Machines */}
          {machines.length > 0 && (
            <div className="space-y-2">
              <Label>Link til lastbiler/maskiner</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                {machines.map(machine => (
                  <div key={machine.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`machine-${machine.id}`}
                      checked={selectedMachines.includes(machine.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMachines([...selectedMachines, machine.id]);
                        } else {
                          setSelectedMachines(selectedMachines.filter(id => id !== machine.id));
                        }
                      }}
                    />
                    <Label htmlFor={`machine-${machine.id}`} className="cursor-pointer text-sm">
                      {machine.name} ({machine.brand} {machine.model})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Truck Brands */}
          <div className="space-y-2">
            <Label>Lastbil mærker</Label>
            <div className="flex flex-wrap gap-2">
              {truckBrands.map(brand => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedTruckBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTruckBrands([...selectedTruckBrands, brand]);
                      } else {
                        setSelectedTruckBrands(selectedTruckBrands.filter(b => b !== brand));
                      }
                    }}
                  />
                  <Label htmlFor={`brand-${brand}`} className="cursor-pointer text-sm">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Truck Types */}
          <div className="space-y-2">
            <Label>Lastbil typer</Label>
            <div className="flex flex-wrap gap-2">
              {truckTypes.map(type => {
                const typeLabels: Record<TruckType, string> = {
                  'tractor': 'Trækker',
                  'crane_with_lad': 'Kran med lad',
                  'hooklift': 'Kroghejs',
                  'zepro_lift': 'Zepro lift',
                  'garbage_truck': 'Skralde lastbil',
                  'water_truck': 'Vandvogn',
                  'sludge_sucker': 'Slamsuger',
                  'other': 'Andet'
                };
                return (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedTruckTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTruckTypes([...selectedTruckTypes, type]);
                        } else {
                          setSelectedTruckTypes(selectedTruckTypes.filter(t => t !== type));
                        }
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="cursor-pointer text-sm">
                      {typeLabels[type]}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <Label>Udstyr</Label>
            <div className="flex flex-wrap gap-2">
              {equipmentTypes.map(equip => {
                const equipLabels: Record<EquipmentAttachment, string> = {
                  'crane': 'Kran',
                  'winch': 'Spil',
                  'boat_supports': 'Bådstøttere',
                  'load_extender': 'Ladeforlængere',
                  'outriggers': 'Støtteben',
                  'other': 'Andet'
                };
                return (
                  <div key={equip} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equip-${equip}`}
                      checked={selectedEquipment.includes(equip)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEquipment([...selectedEquipment, equip]);
                        } else {
                          setSelectedEquipment(selectedEquipment.filter(e => e !== equip));
                        }
                      }}
                    />
                    <Label htmlFor={`equip-${equip}`} className="cursor-pointer text-sm">
                      {equipLabels[equip]}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuller
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              {existingCourse ? 'Opdater' : 'Opret'} Kursus
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseForm;

