
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { UserFormValues } from '@/types/userManagement';
import { DialogFooter } from "@/components/ui/dialog";

interface UserFormProps {
  form: UseFormReturn<UserFormValues>;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ 
  form, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}) => {
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
                <Input placeholder="Indtast brugerens navn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="bruger@eksempel.dk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon (valgfrit)</FormLabel>
              <FormControl>
                <Input placeholder="+45 12345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adgangskode (valgfrit)</FormLabel>
              <FormControl>
                <Input placeholder="1234" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Adgangskoden som brugeren kan logge ind med. Hvis ikke angivet, kan brugeren kun logge ind med email.
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Noter (valgfrit)</FormLabel>
              <FormControl>
                <Input placeholder="Tilføj bemærkninger om brugeren" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rolle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg rolle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="driver">Chauffør</SelectItem>
                  <SelectItem value="mechanic">Mekaniker</SelectItem>
                  <SelectItem value="technician">Tekniker</SelectItem>
                  <SelectItem value="blacksmith">Smed</SelectItem>
                  <SelectItem value="customer">Kunde</SelectItem>
                  <SelectItem value="viewer">Gæst (kun visning)</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter className="pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuller
          </Button>
          <Button type="submit">
            {isEditing ? (
              "Gem ændringer"
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Tilføj bruger
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default UserForm;
