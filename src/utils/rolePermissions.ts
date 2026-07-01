import { UserRole } from '@/types';

/** Roller der må starte/stoppe arbejdstid og se Tidsregistrering-siden */
export const ROLES_CAN_REGISTER_TIME: UserRole[] = [
  'admin',
  'leader',
  'mechanic',
  'technician',
  'blacksmith',
  'lagermand',
];

export const canRegisterTime = (role: string | undefined): boolean =>
  !!role && ROLES_CAN_REGISTER_TIME.includes(role as UserRole);
