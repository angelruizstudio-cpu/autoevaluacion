export default function EnlaceNoValido() {
  return (
    <main style={{ paddingTop: 60 }}>
      <h1 className="res-head">Este enlace ya no está disponible</h1>
      <p className="res-sub">
        Puede que ya lo hayas usado, que haya vencido, o que el ciclo de
        evaluación esté cerrado. Comunícate con quien te lo envió para que te
        genere uno nuevo.
      </p>
      <p className="res-sub" lang="en" style={{ marginTop: 18 }}>
        This link may have already been used, expired, or the assessment cycle
        may be closed. Contact whoever sent it to you for a new one.
      </p>
    </main>
  );
}
