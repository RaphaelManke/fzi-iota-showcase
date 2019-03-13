export class Exception extends Error {
  constructor(message: string, cause?: Error | string) {
    super(message);
    if (cause) {
      const cm = cause instanceof Error ? cause.message : cause;
      this.stack += '\nCaused by: ' + cm;
      if (cause instanceof Error) {
        this.stack += '\n' + cause.stack;
      }
    }
  }
}
