// Allow usage of the <model-viewer> web component in TSX.
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      alt?: string
      ar?: boolean
      cameraControls?: boolean
      'camera-controls'?: boolean
      autoRotate?: boolean
      'auto-rotate'?: boolean
      poster?: string
      exposure?: string | number
    }
  }
}
