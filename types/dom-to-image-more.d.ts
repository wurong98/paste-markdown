declare module 'dom-to-image-more' {
  interface Options {
    scale?: number
    bgcolor?: string
    width?: number
    height?: number
    style?: Record<string, string>
    filter?: (node: Node) => boolean
  }
  const domtoimage: {
    toPng(node: HTMLElement, options?: Options): Promise<string>
    toJpeg(node: HTMLElement, options?: Options): Promise<string>
    toSvg(node: HTMLElement, options?: Options): Promise<string>
    toBlob(node: HTMLElement, options?: Options): Promise<Blob>
  }
  export default domtoimage
}
