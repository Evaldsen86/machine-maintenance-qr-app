declare module '@yudiel/react-qr-scanner' {
  import { ComponentType } from 'react';

  interface QrScannerProps {
    onDecode: (result: string | null) => void;
    onError?: (error: Error) => void;
    constraints?: MediaTrackConstraints;
    className?: string;
  }

  export const QrScanner: ComponentType<QrScannerProps>;
} 