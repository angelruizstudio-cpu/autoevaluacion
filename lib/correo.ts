/* =====================================================================
   Envio de invitaciones por Resend.

   Se llama a la API directo con fetch: es un POST con JSON, no hace
   falta el SDK. El endpoint /emails/batch acepta hasta 100 correos por
   peticion, asi que una ronda de 80 personas es una sola llamada.

   Variables: RESEND_API_KEY y CORREO_DESDE ("Nombre <correo@dominio>",
   el dominio tiene que estar verificado en Resend).
===================================================================== */

export type Invitado = {
  email: string;
  nombre: string | null;
  idioma: "es" | "en";
  enlace: string;
  vence: Date;
};

const LOTE = 100;

/**
 * Manda todos los correos. Devuelve los emails que NO se pudieron
 * enviar: cada lote es todo-o-nada en Resend, asi que si un lote
 * falla, fallan sus 100.
 */
export async function enviarInvitaciones(lista: Invitado[], ciclo: string): Promise<string[]> {
  const fallidos: string[] = [];

  for (let i = 0; i < lista.length; i += LOTE) {
    const lote = lista.slice(i, i + LOTE);
    const r = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(lote.map(inv => ({
        from: process.env.CORREO_DESDE,
        to: [inv.email],
        ...plantilla(inv, ciclo)
      })))
    });
    if (!r.ok) {
      console.error("resend", r.status, await r.text());
      fallidos.push(...lote.map(inv => inv.email));
    }
  }
  return fallidos;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function plantilla(inv: Invitado, cicloCrudo: string) {
  const ciclo = esc(cicloCrudo);
  const nombre = inv.nombre ? esc(inv.nombre) : null;
  const fecha = inv.vence.toLocaleDateString(inv.idioma === "en" ? "en-US" : "es-MX",
    { day: "numeric", month: "long" });
  const saludo = nombre ? (inv.idioma === "en" ? `Hi ${nombre},` : `Hola ${nombre},`)
                            : (inv.idioma === "en" ? "Hi," : "Hola,");

  const t = inv.idioma === "en" ? {
    subject: "Your leadership self-assessment link",
    intro: `You've been invited to take the <b>leadership self-assessment</b> (${ciclo}). It measures how much you rely on each of six leadership styles. It takes about 7 minutes.`,
    boton: "Start the assessment",
    nota: `This link is personal and works once. You can open it and come back if you get interrupted, but once you submit your answers it stops working. It expires on ${fecha}.`,
    honesto: "Answer according to what you actually do today, not what you'd like to do. There are no good or bad styles."
  } : {
    subject: "Tu enlace para la autoevaluación de liderazgo",
    intro: `Te invitamos a tomar la <b>autoevaluación de liderazgo</b> (${ciclo}). Mide cuánto recurres a cada uno de los seis estilos de liderazgo. Toma unos 7 minutos.`,
    boton: "Comenzar la evaluación",
    nota: `Este enlace es personal y funciona una sola vez. Puedes abrirlo y volver si te interrumpen, pero al enviar tus respuestas deja de servir. Vence el ${fecha}.`,
    honesto: "Responde según lo que realmente haces hoy, no según lo que te gustaría hacer. No hay estilos buenos ni malos."
  };

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#E8EBEF;font-family:Karla,'Segoe UI',system-ui,sans-serif;color:#131A28;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #C9CFD9;">
<tr><td style="padding:32px 28px;font-size:17px;line-height:1.55;">
<p style="margin:0 0 16px;">${saludo}</p>
<p style="margin:0 0 16px;">${t.intro}</p>
<p style="margin:0 0 24px;">${t.honesto}</p>
<p style="margin:0 0 24px;"><a href="${inv.enlace}" style="display:inline-block;background:#1B3A6B;color:#fff;text-decoration:none;font-weight:700;padding:15px 26px;border-radius:2px;">${t.boton}</a></p>
<p style="margin:0;font-size:14px;color:#5A6478;">${t.nota}</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = `${saludo}\n\n${t.intro.replace(/<\/?b>/g, "")}\n\n${t.honesto}\n\n${t.boton}: ${inv.enlace}\n\n${t.nota}`;

  return { subject: t.subject, html, text };
}
