
export const nowTs = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random()*16)|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16) }) }
