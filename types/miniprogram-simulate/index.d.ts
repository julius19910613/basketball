declare module "miniprogram-simulate" {
  interface LoadOptions {
    compiler?: string;
  }

  interface SimulateModule {
    load(componentPath: string, options?: LoadOptions): string;
    render(componentId: string, properties?: Record<string, unknown>): unknown;
  }

  const simulate: SimulateModule;

  export default simulate;
}
