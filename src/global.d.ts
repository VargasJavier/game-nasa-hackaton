// estilos globales importados como side-effect
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';

// Image imports
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
