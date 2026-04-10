declare module 'react-qr-reader' {
  import * as React from 'react';

  export interface QrReaderProps {
    delay?: number | false;
    onError?: (error: any) => void;
    onScan?: (data: string | null) => void;
    facingMode?: 'user' | 'environment';
    style?: React.CSSProperties;
  }

  const QrReader: React.FC<QrReaderProps>;
  export default QrReader;
}
