const ts = () => new Date().toISOString();
const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`ℹ️ [${ts()}] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`⚠️ [${ts()}] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`❌ [${ts()}] ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`✅ [${ts()}] ${msg}`, ...args),
};

export default logger;