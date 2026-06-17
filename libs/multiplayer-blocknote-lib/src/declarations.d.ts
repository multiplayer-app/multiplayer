/// <reference types="vite-plugin-svgr/client" />

declare module '*.svg' {
  import * as React from 'react'
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export { ReactComponent }
}

declare module '*.png?inline' {
  const src: string
  export default src
}

declare module '*.jpg?inline' {
  const src: string
  export default src
}
