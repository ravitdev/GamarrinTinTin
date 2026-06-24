export interface MensajeCorreo {
  destinatario: string;
  asunto: string;
  html: string;
  texto?: string;
}

export interface ICorreoAdapter {
  enviarCorreo(mensaje: MensajeCorreo): Promise<boolean>;
}
