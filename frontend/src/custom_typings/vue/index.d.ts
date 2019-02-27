import Vue, { ComponentOptions } from "vue";

declare module "vue/types/options" {
  export interface ComponentOptions<V extends Vue> {
    sockets?: any;
  }
}

declare module "vue/types/vue" {
  export interface Vue {
    $socket: any;
  }
}