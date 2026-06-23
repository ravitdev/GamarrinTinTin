export interface MensajeCorreo {
  destinatario: string;
  asunto: string;
  html: string;
}

export interface ICorreoAdapter {
  enviarCorreo(mensaje: MensajeCorreo): Promise<boolean>;
}
