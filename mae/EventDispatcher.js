class EventDispatcher {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Listener de "${eventName}" deve ser uma função.`);
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    this.listeners.get(eventName).push(callback);
  }

  dispatch(eventName, payload) {
    const callbacks = this.listeners.get(eventName);

    if (!callbacks || callbacks.length === 0) {
      return;
    }

    callbacks.slice().forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Listener de "${eventName}" falhou e foi ignorado: ${error.message}`);
      }
    });
  }
}
