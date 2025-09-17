import { EventEmitter } from "events";

const appEvents = new EventEmitter();
appEvents.setMaxListeners(50); // adjust as needed

export default appEvents;