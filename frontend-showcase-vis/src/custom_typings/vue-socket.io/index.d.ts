declare module "vue-socket.io" {
  import _Vue, { PluginFunction, PluginObject } from "vue";
  import { Store } from "vuex";
  import * as SocketIOClient from "socket.io-client";

  export default class VueSocketIO implements PluginObject<Options> {
    public install: PluginFunction<any>;
    constructor(options?: Options);
  }

  export interface Options {
    debug: boolean;
    vuex: {
      store: Store<any>;
      actionPrefix: string;
      mutationPrefix: string;
    };
    connection: string | SocketIOClient.Socket;
  }
}
