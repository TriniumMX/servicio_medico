declare module 'bwip-js' {
    export interface ToBufferOptions {
        bcid: string; // Barcode type
        text: string; // Text to encode
        scale?: number; // 3x scaling factor
        height?: number; // Bar height, in millimeters
        includetext?: boolean; // Show human-readable text
        textxalign?: 'center' | 'justify' | 'left' | 'right'; // Always good to set this
        textsize?: number; // Font size, in points
        [key: string]: any;
    }

    export function toBuffer(opts: ToBufferOptions): Promise<Buffer>;
    export function toBuffer(opts: ToBufferOptions, callback: (err: any, png: Buffer) => void): void;
}
