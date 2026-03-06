declare module '@react-pdf/renderer' {
  import type { ComponentType, ReactElement } from 'react'

  export const StyleSheet: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create<T extends Record<string, Record<string, any>>>(styles: T): T
  }

  export function pdf(element: ReactElement): {
    toBlob(): Promise<Blob>
    toString(): Promise<string>
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Document: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Page: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const View: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Text: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Link: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Font: ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Image: ComponentType<any>
}
