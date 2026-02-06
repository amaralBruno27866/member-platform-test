// types/nodemailer.d.ts
// Workaround para garantir tipagem correta do nodemailer em projetos TypeScript/NestJS

declare module 'nodemailer' {
  import * as nodemailerTypes from '@types/nodemailer';
  export = nodemailerTypes;
}
