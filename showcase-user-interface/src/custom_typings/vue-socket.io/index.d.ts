declare module "vue-socket.io" {
  import _Vue, { PluginFunction, PluginObject } from "vue";
  import { Store } from "vuex";
  import * as SocketIOClient from "socket.io-client";

  export default class VueSocketIO implements PluginObject<Options> {
    constructor(options?: Options);

    install: PluginFunction<any>;
  }

  export type Options = {
    debug: boolean;
    vuex: {
      store: Store<any>;
      actionPrefix: string;
      mutationPrefix: string;
    };
    connection: string | SocketIOClient.Socket;
  };
}
