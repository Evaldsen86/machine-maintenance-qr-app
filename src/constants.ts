export const ERROR_MESSAGES = {
  MACHINE_NOT_FOUND: 'Maskine ikke fundet',
  VALIDATION_ERROR: 'Valideringsfejl',
  SERVER_ERROR: 'Der opstod en serverfejl',
  INVALID_QR_CODE: 'Ugyldig QR-kode',
  CAMERA_ACCESS_DENIED: 'Kameraadgang nægtet',
  QR_CODE_GENERATION_FAILED: 'Kunne ikke generere QR-kode',
  NETWORK_ERROR: 'Netværksfejl - kontroller din internetforbindelse',
  AUTHENTICATION_ERROR: 'Du skal være logget ind for at fortsætte',
  PERMISSION_ERROR: 'Du har ikke tilladelse til at udføre denne handling',
  FILE_UPLOAD_ERROR: 'Fejl ved upload af fil',
  INVALID_DATE: 'Ugyldigt datoformat',
  INVALID_INPUT: 'Ugyldig indtastning',
  SESSION_EXPIRED: 'Din session er udløbet - log venligst ind igen'
} as const;

export const SUCCESS_MESSAGES = {
  MACHINE_CREATED: 'Maskine oprettet',
  MACHINE_UPDATED: 'Maskine opdateret',
  MACHINE_DELETED: 'Maskine slettet',
  TASK_ADDED: 'Opgave tilføjet',
  MAINTENANCE_ADDED: 'Vedligeholdelsesregistrering tilføjet',
  OIL_INFO_UPDATED: 'Olieinformation opdateret',
  QR_CODE_GENERATED: 'QR-kode genereret',
  QR_CODE_VALID: 'QR-kode valideret',
  FILE_UPLOADED: 'Fil uploadet',
  CHANGES_SAVED: 'Ændringer gemt',
  LOGIN_SUCCESS: 'Logget ind',
  LOGOUT_SUCCESS: 'Logget ud'
} as const; 