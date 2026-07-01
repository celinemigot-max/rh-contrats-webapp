declare module 'html-to-docx' {
  export default function HTMLtoDOCX(
    htmlString: string,
    headerHtmlString?: string | null,
    documentOptions?: Record<string, unknown>,
    footerHtmlString?: string | null
  ): Promise<Buffer | ArrayBuffer>;
}
