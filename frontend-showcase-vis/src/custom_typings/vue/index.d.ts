import Vue, { ComponentOptions } from "vue";
import SocketIOClient from "socket.io-client";
import VueSocketIO from "vue-socket.io";

declare module "vue/types/options" {
  export interface ComponentOptions<V extends Vue> {
    sockets?: {
      [eventName: string]: (...data: any[]) => void;
    };
  }
}

declare module "vue/types/vue" {
  export interface Vue {
    $socket: SocketIOClient.Socket;
    sockets: {
      subscribe: (event: any, data: any) => void;
      unsubscribe: (event: any) => void;
    };
    $vueSocketIo: VueSocketIO;
  }
}
