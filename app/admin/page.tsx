import { admin } from "@/lib/supabase-admin";
import { entrar, salir, enviar, esAdmin } from "./acciones";

export const dynamic = "force-dynamic";

type Params = Promise<{ ciclo?: string; enviados?: string; fallidos?: string; error?: string }>;

export default async function Admin({ searchParams }: { searchParams: Params }) {
  const q = await searchParams;
  if (!(await esAdmin())) return <Entrar error={q.error} />;

  const db = admin();
  // ponytail: se traen todas las invitaciones para contar. A escala de
  // iglesia son cientos; si un dia son decenas de miles, contar en SQL.
  const [{ data: ciclos }, { data: invs }] = await Promise.all([
    db.from("ciclos").select("id, nombre, creado_en, abierto").order("creado_en", { ascending: false }),
    db.from("invitaciones").select("id, ciclo_id, nombre, email, ministerio, idioma, iniciado_en, consumido_en, expira_en")
      .order("nombre")
  ]);

  const porCiclo = new Map<string, typeof invs>();
  for (const i of invs ?? []) porCiclo.set(i.ciclo_id, [...(porCiclo.get(i.ciclo_id) ?? []), i]);
  const abierto = q.ciclo ? porCiclo.get(q.ciclo) ?? [] : [];
  const nombreAbierto = ciclos?.find(c => c.id === q.ciclo)?.nombre;

  return (
    <main>
      <div className="topbar">
        <span className="title">Panel de administración</span>
        <form action={salir}><button className="link">Salir</button></form>
      </div>

      <h1 className="res-head">Enviar invitaciones</h1>
      <p className="res-sub">
        Cada persona recibe un correo con su enlace personal de un solo uso. El
        enlace vence a los 14 días.
      </p>

      {q.error && <p className="aviso error">{q.error}</p>}
      {q.enviados && (
        <p className="aviso ok">
          {q.enviados} {q.enviados === "1" ? "invitación enviada" : "invitaciones enviadas"}.
          {q.fallidos && <> No se pudo enviar a: {q.fallidos}. Esas personas no quedaron registradas; vuelve a intentarlo con ellas.</>}
        </p>
      )}

      <form action={enviar} className="panel">
        <label>
          Nombre de la ronda
          <input name="ciclo" required placeholder="Liderazgo ICP — Otoño 2026" />
        </label>
        <label>
          Participantes — uno por línea: <code>nombre, correo, ministerio, idioma</code>
          <textarea
            name="participantes" required rows={8} spellCheck={false}
            placeholder={"Jose Rivera, jose@ejemplo.com, Jóvenes, es\nMary Colon, mary@ejemplo.com, Alabanza, en"}
          />
        </label>
        <p className="ayuda">
          Puedes pegar directo desde Excel o Google Sheets (cuatro columnas). El
          idioma es <code>es</code> o <code>en</code>; si falta, se asume español.
          El ministerio alimenta el consolidado por grupo.
        </p>
        <div className="actions">
          <button className="btn">Generar enlaces y enviar correos</button>
        </div>
      </form>

      <h2 className="sec">Rondas</h2>
      {!ciclos?.length && <p className="res-sub">Todavía no hay rondas.</p>}
      {!!ciclos?.length && (
        <table className="tabla">
          <thead><tr><th>Ronda</th><th>Invitados</th><th>Abrieron</th><th>Completaron</th></tr></thead>
          <tbody>
            {ciclos.map(c => {
              const l = porCiclo.get(c.id) ?? [];
              return (
                <tr key={c.id} className={c.id === q.ciclo ? "sel" : undefined}>
                  <td>
                    <a href={`/admin?ciclo=${c.id}`}>{c.nombre}</a>
                    <small>{new Date(c.creado_en).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}{!c.abierto && " · cerrada"}</small>
                  </td>
                  <td>{l.length}</td>
                  <td>{l.filter(i => i.iniciado_en).length}</td>
                  <td>{l.filter(i => i.consumido_en).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {q.ciclo && (
        <>
          <h2 className="sec">{nombreAbierto ?? "Ronda"}</h2>
          {!abierto.length && <p className="res-sub">Sin invitaciones en esta ronda.</p>}
          {!!abierto.length && (
            <table className="tabla">
              <thead><tr><th>Persona</th><th>Ministerio</th><th>Estado</th></tr></thead>
              <tbody>
                {abierto.map(i => (
                  <tr key={i.id}>
                    <td>{i.nombre ?? "—"}<small>{i.email} · {i.idioma}</small></td>
                    <td>{i.ministerio ?? "—"}</td>
                    <td>{estado(i)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="ayuda">
            El consolidado por ministerio se ve en Supabase:{" "}
            <code>select * from consolidado_ministerio where ciclo_id = &apos;{q.ciclo}&apos;;</code>
          </p>
        </>
      )}
    </main>
  );
}

function estado(i: { iniciado_en: string | null; consumido_en: string | null; expira_en: string }) {
  if (i.consumido_en) return "Completó";
  if (new Date(i.expira_en) < new Date()) return "Venció";
  if (i.iniciado_en) return "Abrió, sin terminar";
  return "Enviado";
}

function Entrar({ error }: { error?: string }) {
  return (
    <main style={{ paddingTop: 60 }}>
      <h1 className="res-head">Administración</h1>
      {error && <p className="aviso error">{error}</p>}
      <form action={entrar} className="panel">
        <label>
          Contraseña
          <input type="password" name="password" required autoFocus autoComplete="current-password" />
        </label>
        <div className="actions"><button className="btn">Entrar</button></div>
      </form>
    </main>
  );
}
