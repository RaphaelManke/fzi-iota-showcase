declare module "vue-socket.io" {
  import {PluginFunction, PluginObject} from 'vue';
  import {Store} from 'vuex';
  import SocketIOClientStatic from 'socket.io-client';

  export default class VueSocketIO implements PluginObject<any> {
    constructor(options: Options);

    install: PluginFunction<any>;
  }

  export type Options = {
    debug: boolean,
    vuex: {
      store: Store<any>,
      actionPrefix: string,
      mutationPrefix: string
    }
    connection: string | SocketIOClientStatic
  }
}