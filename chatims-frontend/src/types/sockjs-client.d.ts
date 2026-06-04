declare module 'sockjs-client' {
  const SockJS: new (url: string, _reserved?: unknown, options?: unknown) => WebSocket;
  export default SockJS;
}
