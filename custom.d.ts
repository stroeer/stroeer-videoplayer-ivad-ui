declare module "*.svg" {
  const content: any;
  export default content;
}

interface Navigator extends Navigator {
  msMaxTouchPoints: number
}
