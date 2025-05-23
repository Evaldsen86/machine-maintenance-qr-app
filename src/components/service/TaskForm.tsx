import React, { useState } from 'react';
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, ClipboardList } from "lucide-react";
import { EquipmentType, Task } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from "@/lib/utils";

// Form schema for task
const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Titlen skal være mindst 3 tegn." }),
  description: z.string().min(5, { message: "Beskrivelsen skal være mindst 5 tegn." }),
  equipmentType: z.enum(["truck", "crane", "winch", "hooklift"] as const),
  dueDate: z.date({
    required_error: "Vælg venligst en deadline.",
  }),
  assignedTo: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  machineId: string;
  onSubmit: (data: Task) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  machineId,
  onSubmit,
}) => {
  const { user } = useAuth();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Initialize form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      equipmentType: "truck",
      assignedTo: user?.name || "",
    },
  });

  const handleSubmit = (values: TaskFormValues) => {
    // Create a unique ID
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the new task object
    const newTask: Task = {
      id,
      title: values.title,
      description: values.description,
      equipmentType: values.equipmentType,
      dueDate: values.dueDate.toISOString(),
      status: 'pending',
      assignedTo: values.assignedTo || undefined,
    };
    
    // Call the parent onSubmit function with the task
    onSubmit(newTask);
    
    // Reset the form
    form.reset({
      title: "",
      description: "",
      equipmentType: "truck",
      dueDate: undefined,
      assignedTo: user?.name || "",
    });
    
    // Show success toast
    toast({
      title: "Opgave oprettet",
      description: "Den nye opgave er blevet tilføjet.",
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

  const users = [
    { id: '1', name: 'Admin' },
    { id: '2', name: 'Technician' },
    { id: '3', name: 'Mechanic' }
  ];

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center space-x-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Opret Ny Opgave</h3>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl>
                  <Input placeholder="Indtast titel på opgaven" {...field} />
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
                <FormLabel>Beskrivelse</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Beskriv opgaven..." 
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: da })
                          ) : (
                            <span>Vælg dato</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tildel til (valgfrit)</FormLabel>
                <FormControl>
                  {users.some(u => u.name === form.watch('assignedTo')) ? (
                    <Select
                      onValueChange={(value) => form.setValue('assignedTo', value)}
                      value={form.watch('assignedTo')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg person" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Eller indtast navn manuelt"
                      value={form.watch('assignedTo')}
                      onChange={(e) => form.setValue('assignedTo', e.target.value)}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">
            Opret Opgave
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TaskForm;
