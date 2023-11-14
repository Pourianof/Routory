type RoutoryEvents = 'endofmwexecution';

type Listener = () => any;

export default class Notifier {
  private listeners: Map<RoutoryEvents, Listener[]> = new Map();
  on(event: RoutoryEvents, listener: Listener) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event);
      list?.push(listener);
    } else {
      this.listeners.set(event, [listener]);
    }
  }

  protected trigger(eventName: RoutoryEvents) {
    if (this.listeners.has(eventName)) {
      const list = this.listeners.get(eventName);
      list?.forEach((l) => {
        l();
      });
    }
  }
}
