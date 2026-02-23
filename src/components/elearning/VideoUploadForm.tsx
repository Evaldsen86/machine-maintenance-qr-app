import { useState } from 'react';
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
import { Video, Machine, TruckBrand, TruckType, EquipmentAttachment } from '@/types';
import { toast } from "@/components/ui/use-toast";
import { Upload, X } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, "Titel er påkrævet"),
  description: z.string().optional(),
  category: z.string().min(1, "Kategori er påkrævet"),
  subCategory: z.string().optional(),
  videoUrl: z.string().url("Ugyldig URL").optional().or(z.literal("")),
});

interface VideoUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (video: Video) => void;
  machines?: Machine[];
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({
  isOpen,
  onClose,
  onSave,
  machines = []
}) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const [selectedTruckBrands, setSelectedTruckBrands] = useState<TruckBrand[]>([]);
  const [selectedTruckTypes, setSelectedTruckTypes] = useState<TruckType[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentAttachment[]>([]);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      subCategory: '',
      videoUrl: '',
    },
  });

  const categories = [
    'Kran',
    'Sideloader',
    'Lastbil checks',
    'Udstyr',
    'Sikkerhed',
    'Vedligeholdelse',
    'Andet'
  ];

  const subCategories = {
    'Kran': ['Pakke ud', 'Pakke ind', 'Støtteben', 'Spil', 'Bådstøttere', 'Ladeforlængere', 'Løfteopgaver'],
    'Sideloader': ['Operation', 'Vedligeholdelse'],
    'Lastbil checks': ['Daglige checks', 'Ugentlige checks', 'Månedlige checks'],
    'Udstyr': ['Kran', 'Spil', 'Bådstøttere', 'Ladeforlængere'],
    'Sikkerhed': ['Generelt', 'Løfteopgaver'],
    'Vedligeholdelse': ['Daglige', 'Ugentlige', 'Månedlige'],
    'Andet': []
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setUseUrl(false);
      } else {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Vælg venligst en videofil.",
        });
      }
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setThumbnailFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Vælg venligst en billedfil.",
        });
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!useUrl && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg venligst en videofil eller indtast en video URL.",
      });
      return;
    }

    if (useUrl && !values.videoUrl) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Indtast venligst en video URL.",
      });
      return;
    }

    try {
      let finalVideoUrl = '';
      let thumbnailUrl = '';

      if (useUrl) {
        finalVideoUrl = values.videoUrl || '';
      } else if (selectedFile) {
        // Create blob URL for the video file
        finalVideoUrl = URL.createObjectURL(selectedFile);
      }

      if (thumbnailFile) {
        thumbnailUrl = URL.createObjectURL(thumbnailFile);
      }

      const newVideo: Video = {
        id: `video-${Date.now()}`,
        title: values.title,
        description: values.description,
        videoUrl: finalVideoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        category: values.category,
        subCategory: values.subCategory || undefined,
        equipmentAttachment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        truckBrands: selectedTruckBrands.length > 0 ? selectedTruckBrands : undefined,
        truckTypes: selectedTruckTypes.length > 0 ? selectedTruckTypes : undefined,
        machineIds: selectedMachines.length > 0 ? selectedMachines : undefined,
        createdAt: new Date().toISOString(),
        createdBy: user?.id,
      };

      onSave(newVideo);
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      setThumbnailFile(null);
      setVideoUrl('');
      setUseUrl(false);
      setSelectedTruckBrands([]);
      setSelectedTruckTypes([]);
      setSelectedEquipment([]);
      setSelectedMachines([]);
      
      toast({
        title: "Video tilføjet",
        description: "Videoen er blevet tilføjet til e-learning systemet.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving video:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl under gemning af videoen.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tilføj Video</DialogTitle>
          <DialogDescription>
            Upload en video eller tilføj en video URL til e-learning systemet
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="F.eks. Hvordan pakker man en kran ud"
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
              placeholder="Beskrivelse af videoen..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            {form.watch("category") && subCategories[form.watch("category") as keyof typeof subCategories]?.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subCategory">Underkategori</Label>
                <Select
                  value={form.watch("subCategory") || ''}
                  onValueChange={(value) => form.setValue("subCategory", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg underkategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories[form.watch("category") as keyof typeof subCategories].map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Video Upload or URL */}
          <div className="space-y-2">
            <Label>Video</Label>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useFile"
                  checked={!useUrl}
                  onCheckedChange={(checked) => setUseUrl(!checked)}
                />
                <Label htmlFor="useFile" className="cursor-pointer">Upload fil</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useUrl"
                  checked={useUrl}
                  onCheckedChange={(checked) => setUseUrl(checked)}
                />
                <Label htmlFor="useUrl" className="cursor-pointer">Brug URL</Label>
              </div>
            </div>

            {!useUrl ? (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-sm">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    form.setValue("videoUrl", e.target.value);
                  }}
                />
              </div>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail (valgfrit)</Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {thumbnailFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm">{thumbnailFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setThumbnailFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
              <Upload className="h-4 w-4 mr-2" />
              Tilføj Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadForm;

