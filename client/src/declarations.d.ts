declare module '*.module.scss' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.scss'

declare const __APP_VERSION__: string
