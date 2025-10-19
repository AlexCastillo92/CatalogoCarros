import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Carga de datos (en memoria)
const autos = JSON.parse(fs.readFileSync("./autos.json", "utf8"));

// Healthcheck
app.get("/health", (_, res) => res.json({ status: "ok" }));

// Esquema (documentación simple)
app.get("/schema", (_, res) => {
  res.json({
    type: "object",
    items: {
      id: "number",
      marca: "string",
      modelo: "string",
      anio: "number",
      precio: "number",
      color: "string"
    }
  });
});

// GET /api/autos  (listado + filtros)
// Filtros soportados: marca, modelo, color, anio, precio_min, precio_max
app.get("/api/autos", (req, res) => {
  const { marca, modelo, color, anio, precio_min, precio_max } = req.query;

  let resultado = [...autos];

  if (marca)      resultado = resultado.filter(a => a.marca.toLowerCase()  === String(marca).toLowerCase());
  if (modelo)     resultado = resultado.filter(a => a.modelo.toLowerCase() === String(modelo).toLowerCase());
  if (color)      resultado = resultado.filter(a => a.color.toLowerCase()  === String(color).toLowerCase());
  if (anio)       resultado = resultado.filter(a => a.anio === Number(anio));
  if (precio_min) resultado = resultado.filter(a => a.precio >= Number(precio_min));
  if (precio_max) resultado = resultado.filter(a => a.precio <= Number(precio_max));

  res.json(resultado);
});

// GET /api/autos/:id
app.get("/api/autos/:id", (req, res) => {
  const id = Number(req.params.id);
  const auto = autos.find(a => a.id === id);
  if (!auto) return res.status(404).json({ error: "Auto no encontrado" });
  res.json(auto);
});

// POST /api/autos (crear) — opcional
app.post("/api/autos", (req, res) => {
  const { marca, modelo, anio, precio, color } = req.body || {};
  if (!marca || !modelo || !anio || !precio || !color) {
    return res.status(400).json({ error: "Faltan campos obligatorios (marca, modelo, anio, precio, color)" });
  }
  const id = autos.length ? Math.max(...autos.map(a => a.id)) + 1 : 1;
  const nuevo = { id, marca, modelo, anio: Number(anio), precio: Number(precio), color };
  autos.push(nuevo);
  res.status(201).json(nuevo);
});

// PUT /api/autos/:id (actualizar) — opcional
app.put("/api/autos/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = autos.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "Auto no encontrado" });

  const { marca, modelo, anio, precio, color } = req.body || {};
  const actualizado = {
    ...autos[idx],
    ...(marca  !== undefined ? { marca }  : {}),
    ...(modelo !== undefined ? { modelo } : {}),
    ...(anio   !== undefined ? { anio: Number(anio) } : {}),
    ...(precio !== undefined ? { precio: Number(precio) } : {}),
    ...(color  !== undefined ? { color }  : {})
  };
  autos[idx] = actualizado;
  res.json(actualizado);
});

// DELETE /api/autos/:id — opcional
app.delete("/api/autos/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = autos.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "Auto no encontrado" });
  const eliminado = autos.splice(idx, 1)[0];
  res.json(eliminado);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Autos service escuchando en http://localhost:${PORT}`));
