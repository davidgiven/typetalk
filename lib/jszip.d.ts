interface JSZip {
    /**
     * Get a file from the archive
     *
     * @param Path relative path to file
     * @return File matching path, null if no file found
     */
    file(path: string): JSZipObject;

    /**
     * Get files matching a RegExp from archive
     *
     * @param path RegExp to match
     * @return Return all matching files or an empty array
     */
    file(path: RegExp): JSZipObject[];

    /**
     * Add a file to the archive
     *
     * @param path Relative path to file
     * @param content Content of the file
     * @param options Optional information about the file
     * @return JSZip object
     */
    file(path: string, data: any, options?: JSZipFileOptions): JSZip;

    /**
     * Return an new JSZip instance with the given folder as root
     *
     * @param name Name of the folder
     * @return New JSZip object with the given folder as root or null
     */
    folder(name: string): JSZip;

    /**
     * Returns new JSZip instances with the matching folders as root
     *
     * @param name RegExp to match
     * @return New array of JSZipFile objects which match the RegExp
     */
    folder(name: RegExp): JSZipObject[];

    /**
     * Iterate over all files
     *
     * @param predicate Filter function
     * @return Array of matched elements
     */
    forEach(callback: (relativePath: string, file: JSZipObject) => void): void;
    
    /**
     * Get all files which match the given filter function
     *
     * @param predicate Filter function
     * @return Array of matched elements
     */
    filter(predicate: (relativePath: string, file: JSZipObject) => boolean): JSZipObject[];

    /**
     * Removes the file or folder from the archive
     *
     * @param path Relative path of file or folder
     * @return Returns the JSZip instance
     */
    remove(path: string): JSZip;

    /**
     * Generates a new archive
     *
     * @param options Options for the generator
     * @return Returns a Promise of the generated zip file.
     */
    generateAsync(options: JSZipGeneratorOptions, onUpdate?: JSZipMetaUpdateCallback): Promise<any>;
    
    /**
     * Generates the complete zip file as a nodejs stream.
     * 
     * @param options Options for the generator
     * @return Returns a readable stream
     */
    generateNodeStream(options: JSZipGeneratorOptions, onUpdate?: JSZipMetaUpdateCallback): NodeJS.ReadableStream

    /**
     * Generates the complete zip file with the internal stream implementation.
     * 
     * @param options Options for the generator
     */
    generateInternalStream(options: JSZipGeneratorOptions): JSZipStreamHelper;

    /**
     * Deserialize zip file
     *
     * @param data Serialized zip file
     * @param options Options for deserializing
     * @return Returns the JSZip instance
     */
    loadAsync(data: any, options: JSZipLoadOptions): Promise<JSZipObject>;
}

interface JSZipObject {
    name: string;
    dir: boolean;
    date: Date;
    comment: string;
    unixPermissions: number;
    dosPermissions: number;
    options: {
        compression: string
    };

    async(type: string, onUpdate?: JSZipMetaUpdateCallback): Promise<any>;
    nodeStream(type: string, onUpdate?: JSZipMetaUpdateCallback): NodeJS.ReadableStream;
    internalStream(type: string): JSZipStreamHelper;
}

interface JSZipFileOptions {
    base64?: boolean;
    binary?: boolean;
    date?: Date;
    compression?: string;
    compressionOptions?: JSZipCompressionOptions;
    comment?: string;
    optimizedBinaryString?: boolean;
    createFolders?: boolean;
    unixPermissions?: boolean;
    dosPermissions?: boolean;
    dir?: boolean;
}

interface JSZipGeneratorOptions {
    compression?: string;
    compressionOptions?: JSZipCompressionOptions;
    type?: string;
    comment?: string;
    mimeType?: string;
    platform?: string;
    encodeFileName?: (data: any) => string;
    streamFiles?: boolean;
}

interface JSZipLoadOptions {
    base64?: boolean;
    checkCRC32?: boolean;
    optimizedBinaryString?: boolean;
    createFolders?: boolean;
    decodeFileName?: (data: any) => string;
}

interface JSZipCompressionOptions {
    level?: number;
}

interface JSZipStreamHelper {
    on(event: "data", callback: (chunk: any, metadata: JSZipMetadata) => void): this;
    on(event: "error", callback: (error: Error) => void): this;
    on(event: "end", callback: () => void): this;
    on(event: string, callback: Function): this;
    
    accumulate(callback: (error: any, data: any) => void, updateCallback?: (metadata: JSZipMetadata) => void): void;
    resume(): this;
    pause(): this;
}

interface JSZipSupport {
    arraybuffer: boolean;
    uint8array: boolean;
    blob: boolean;
    nodebuffer: boolean;
    nodestream: boolean;
}

interface JSZipMetadata {
    percent: number;
    currentFile: string;
}

interface JSZipMetaUpdateCallback {
    (percent: number, currentFile: string): void;
}

declare var JSZip: {
    /**
     * Create JSZip instance
     */
    (): JSZip;

    /**
     * Create JSZip instance
     */
    new (): JSZip;
    
    prototype: JSZip;
    loadAsync: (data: any, options: JSZipLoadOptions) => Promise<JSZipObject>;
    support: JSZipSupport;
    external: {
        Promise: Object
    };
}

declare module "jszip" {
    export = JSZip;
}