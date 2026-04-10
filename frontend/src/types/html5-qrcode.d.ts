declare module 'html5-qrcode' {
  export interface Html5QrcodeResult {
    decodedText: string;
    result: any;
  }

  export interface Html5QrcodeCameraScanConfig {
    fps?: number;
    qrbox?: {
      width: number;
      height: number;
    } | number;
    aspectRatio?: number;
    disableFlip?: boolean;
  }

  export interface Html5QrcodeFullConfig {
    formatsToSupport?: any[];
    experimentalFeatures?: {
      useBarCodeDetectorIfSupported?: boolean;
    };
    verbose?: boolean;
  }

  export class Html5Qrcode {
    constructor(elementId: string, config?: Html5QrcodeFullConfig | boolean);
    
    start(
      cameraIdOrConfig: string | { facingMode: string },
      configuration: Html5QrcodeCameraScanConfig | undefined,
      qrCodeSuccessCallback: (decodedText: string, result: Html5QrcodeResult) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: any) => void
    ): Promise<null>;
    
    stop(): Promise<void>;
    
    pause(shouldPauseVideo?: boolean): void;
    
    resume(): void;
    
    getState(): number;
    
    clear(): Promise<void>;
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config?: Html5QrcodeCameraScanConfig,
      verbose?: boolean
    );
    
    render(
      qrCodeSuccessCallback: (decodedText: string, result: Html5QrcodeResult) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: any) => void
    ): void;
    
    clear(): Promise<void>;
  }
}