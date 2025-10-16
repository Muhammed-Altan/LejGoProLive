declare module 'validator' {
  export function isEmail(str: string): boolean;
  export function isMobilePhone(str: string, locale?: string | string[]): boolean;
  const defaultExport: {
    isEmail: typeof isEmail;
    isMobilePhone: typeof isMobilePhone;
  };
  export default defaultExport;
}
