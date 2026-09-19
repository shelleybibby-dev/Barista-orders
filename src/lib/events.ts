import { EventEmitter } from "node:events";

const globalForEvents = globalThis as typeof globalThis & {
  __baristaOrderEvents?: EventEmitter;
};

export function getOrderEvents(): EventEmitter {
  if (!globalForEvents.__baristaOrderEvents) {
    globalForEvents.__baristaOrderEvents = new EventEmitter();
    globalForEvents.__baristaOrderEvents.setMaxListeners(200);
  }

  return globalForEvents.__baristaOrderEvents;
}
