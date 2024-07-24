import { ResponseObject } from "@hapi/hapi";

export interface ToolkitRenderMethod {
    (component: string, props?: Record<string, any>, viewData?: Record<string, any>): ResponseObject;
}

declare module '@hapi/hapi' {
    interface ResponseToolkit {
        inertia: ToolkitRenderMethod
    }
}

export declare const plugin: Plugin<ServerViewsConfiguration>;