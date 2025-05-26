import { User, UserRole } from '@/types';
import { z } from 'zod';

// Form user role type including all valid role options
export type FormUserRole = 'admin' | 'mechanic' | 'technician' | 'driver' | 'blacksmith' | 'viewer' | 'customer' | 'guest';

// Zod schema for user form validation
export const userFormSchema = z.object({
  name: z.string().min(2, { message: "Navn skal være mindst 2 tegn." }),
  email: z.string().email({ message: "Indtast en gyldig email-adresse." }),
  role: z.enum(["viewer", "driver", "mechanic", "technician", "blacksmith", "admin", "customer", "guest"] as const),
  phone: z.string().optional(),
  passcode: z.string().min(4, { message: "Adgangskode skal være mindst 4 tegn."})
      .max(10, { message: "Adgangskode må maksimalt være 10 tegn."})
      .optional(),
  notes: z.string().optional(),
  canRegisterService: z.boolean().optional(),
  canRegisterLubrication: z.boolean().optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
