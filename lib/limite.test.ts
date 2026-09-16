/* Prueba del limitador. Correr con: npm test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { permitir, reiniciar } from "./limite.ts";

const T0 = 1_000_000;
const VENTANA = 60_000;

test("deja pasar hasta el maximo y despues bloquea", () => {
  reiniciar();
  for (let i = 0; i < 3; i++) {
    assert.equal(permitir("1.1.1.1", 3, VENTANA, T0), true, `intento ${i + 1}`);
  }
  assert.equal(permitir("1.1.1.1", 3, VENTANA, T0), false);
});

test("la ventana se desliza: al vencer vuelve a permitir", () => {
  reiniciar();
  for (let i = 0; i < 3; i++) permitir("2.2.2.2", 3, VENTANA, T0);
  assert.equal(permitir("2.2.2.2", 3, VENTANA, T0 + VENTANA - 1), false, "aun dentro");
  assert.equal(permitir("2.2.2.2", 3, VENTANA, T0 + VENTANA), true, "ya fuera");
});

test("cada IP lleva su propia cuenta", () => {
  reiniciar();
  for (let i = 0; i < 3; i++) permitir("3.3.3.3", 3, VENTANA, T0);
  assert.equal(permitir("3.3.3.3", 3, VENTANA, T0), false);
  assert.equal(permitir("4.4.4.4", 3, VENTANA, T0), true);
});

test("seguir golpeando bloqueado no alarga el castigo", () => {
  reiniciar();
  for (let i = 0; i < 3; i++) permitir("5.5.5.5", 3, VENTANA, T0);
  // martillea durante toda la ventana
  for (let t = T0; t < T0 + VENTANA; t += 1000) permitir("5.5.5.5", 3, VENTANA, t);
  // al vencer la ventana del ultimo intento valido, vuelve a entrar
  assert.equal(permitir("5.5.5.5", 3, VENTANA, T0 + VENTANA), true);
});
