import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Trash2, Plus, Camera, Wand2, Download, ImagePlus } from "lucide-react";

// --- Mini base de datos de alimentos (kcal por 100g o por unidad) ---
const FOOD_DB = [
  { name: "Manzana", kcalPer100g: 52 },
  { name: "Banana", kcalPer100g: 89 },
  { name: "Arroz cocido", kcalPer100g: 130 },
  { name: "Pasta cocida", kcalPer100g: 157 },
  { name: "Pollo a la plancha", kcalPer100g: 165 },
  { name: "Ternera", kcalPer100g: 217 },
  { name: "Salmón", kcalPer100g: 208 },
  { name: "Huevo (unidad)", kcalPerUnit: 78 },
  { name: "Pan rebanada", kcalPerUnit: 80 },
  { name: "Pizza (porción)", kcalPerUnit: 285 },
  { name: "Aguacate", kcalPer100g: 160 },
  { name: "Queso", kcalPer100g: 402 },
  { name: "Yogur natural", kcalPer100g: 59 },
  { name: "Lechuga", kcalPer100g: 15 },
  { name: "Tomate", kcalPer100g: 18 },
  { name: "Patata cocida", kcalPer100g: 87 },
  { name: "Aceite de oliva", kcalPer100g: 884 },
];

function findFood(term) {
  const t = term.toLowerCase();
  return FOOD_DB.filter((f) => f.name.toLowerCase().includes(t));
}

// Tipos de ítems en el plato
// grams: si el alimento usa kcal/100g
// units: si el alimento usa kcal/unidad
function kcalForItem(item) {
  if (item.kcalPer100g) return (item.kcalPer100g * (item.grams || 0)) / 100;
  if (item.kcalPerUnit) return (item.kcalPerUnit * (item.units || 0));
  return 0;
}

export default function CalorieSnap() {
  const [imageSrc, setImageSrc] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [items, setItems] = useState([]);
  const fileRef = useRef(null);

  const totalKcal = items.reduce((sum, it) => sum + kcalForItem(it), 0);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
  }

  function addFood(base) {
    const id = `${base.name}-${Date.now()}`;
    const newItem = {
      id,
      name: base.name,
      kcalPer100g: base.kcalPer100g,
      kcalPerUnit: base.kcalPerUnit,
      grams: base.kcalPer100g ? 150 : undefined, // por defecto 150g
      units: base.kcalPerUnit ? 1 : undefined,   // por defecto 1 unidad
    };
    setItems((prev) => [...prev, newItem]);
    setQuery("");
    setSuggestions([]);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function changeItem(id, patch) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  // --- Simulación de detección automática (DEMO) ---
  // Nota: para producción conecta esto con tu backend de visión AI (p.ej. Google Vision, Azure Custom Vision, Clarifai, Roboflow, etc.).
  function autoDetectDemo() {
    if (!imageSrc) return;
    // Elegimos 1-3 alimentos al azar como demo.
    const candidates = ["Manzana", "Banana", "Pizza (porción)", "Pollo a la plancha", "Arroz cocido", "Tomate", "Pan rebanada"];
    const n = Math.floor(Math.random() * 3) + 1;
    const picks = [...candidates].sort(() => 0.5 - Math.random()).slice(0, n);
    const bases = picks.map((name) => FOOD_DB.find((f) => f.name === name)).filter(Boolean);
    bases.forEach(addFood);
  }

  function downloadReport() {
    const report = {
      date: new Date().toISOString(),
      totalKcal: Math.round(totalKcal),
      items: items.map((it) => ({
        name: it.name,
        grams: it.grams,
        units: it.units,
        kcal: Math.round(kcalForItem(it)),
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calories-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 p-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        {/* Lado izquierdo: imagen & acciones */}
        <Card className="shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Camera className="w-5 h-5"/> Foto del plato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageSrc ? (
              <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt="plato" className="object-contain w-full h-full"/>
              </div>
            ) : (
              <div className="w-full aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="w-10 h-10"/>
                  <span>Sube una foto para empezar</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Input type="file" accept="image/*" ref={fileRef} onChange={onFile} className="max-w-xs"/>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2"/>Elegir foto
              </Button>
              <Button onClick={autoDetectDemo} disabled={!imageSrc}>
                <Wand2 className="w-4 h-4 mr-2"/>Auto‑detectar (demo)
              </Button>
              <Button variant="outline" onClick={downloadReport} disabled={items.length===0}>
                <Download className="w-4 h-4 mr-2"/>Descargar reporte
              </Button>
            </div>

            <div className="text-sm text-slate-500">
              <p><strong>Nota:</strong> La detección automática aquí es solo de demostración. Para resultados reales conecta un servicio de visión por computador y porciones (ver README más abajo).</p>
            </div>
          </CardContent>
        </Card>

        {/* Lado derecho: lista de alimentos & total */}
        <Card className="shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Plus className="w-5 h-5"/> Añadir alimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Buscar alimento</Label>
              <Input id="search" placeholder="Ej. Manzana, Pollo, Arroz…" value={query}
                     onChange={(e)=>{
                       const v = e.target.value;
                       setQuery(v);
                       setSuggestions(v.length>0 ? findFood(v) : []);
                     }}
              />
              {suggestions.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <Badge key={s.name} className="cursor-pointer" onClick={()=>addFood(s)}>
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {items.length===0 && (
                <div className="text-slate-500 text-sm">No hay alimentos añadidos aún.</div>
              )}

              {items.map((it)=> (
                <div key={it.id} className="p-3 rounded-xl border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{it.name}</div>
                    <Button size="icon" variant="ghost" onClick={()=>removeItem(it.id)}>
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                  </div>

                  {it.kcalPer100g ? (
                    <div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Porción (g): {it.grams} g</span>
                        <span>{Math.round((it.kcalPer100g * (it.grams||0))/100)} kcal</span>
                      </div>
                      <Slider value={[it.grams||0]} min={0} max={600} step={10}
                              onValueChange={(v)=>changeItem(it.id,{grams: v[0]})}
                      />
                      <div className="flex gap-2 mt-2">
                        {[80,120,150,200,300].map((g)=> (
                          <Button key={g} variant="outline" size="sm" onClick={()=>changeItem(it.id,{grams:g})}>{g} g</Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Unidades: {it.units}</span>
                        <span>{(it.kcalPerUnit||0) * (it.units||0)} kcal</span>
                      </div>
                      <Slider value={[it.units||0]} min={0} max={5} step={1}
                              onValueChange={(v)=>changeItem(it.id,{units: v[0]})}
                      />
                      <div className="flex gap-2 mt-2">
                        {[0,1,2,3].map((u)=> (
                          <Button key={u} variant="outline" size="sm" onClick={()=>changeItem(it.id,{units:u})}>{u} u</Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-slate-700">
                    {it.kcalPer100g && (
                      <span>{it.kcalPer100g} kcal / 100g</span>
                    )}
                    {it.kcalPerUnit && (
                      <span>{it.kcalPerUnit} kcal / unidad</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border flex items-center justify-between">
              <div className="text-slate-600">Total estimado</div>
              <div className="text-2xl font-semibold">{Math.round(totalKcal)} kcal</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* README rápido / instrucciones */}
      <div className="max-w-6xl mx-auto mt-6 text-sm text-slate-600 leading-6">
        <h3 className="text-base font-semibold mb-2">Cómo funciona este MVP</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Sube una foto de tu plato.</li>
          <li>Pulsa <em>Auto‑detectar (demo)</em> para añadir algunos alimentos de ejemplo <strong>(no es IA real)</strong>.</li>
          <li>Añade/edita alimentos manualmente desde el buscador y ajusta la porción (gramos o unidades).</li>
          <li>Observa el total de calorías y, si quieres, descarga un reporte JSON.</li>
        </ol>
        <h4 className="text-base font-semibold mt-4 mb-1">Conectar IA real (siguiente paso)</h4>
        <p>
          Sustituye la función <code>autoDetectDemo()</code> por una llamada a tu backend que haga:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Detección/clasificación de alimentos en la imagen (ej. modelos de visión por computador).</li>
          <li>Estimación de tamaño/porciones (puedes usar referencias conocidas como una tarjeta, una mano, etc.).</li>
          <li>Mapeo de cada etiqueta detectada a esta base de datos de calorías (o una más completa como USDA/CIQUAL).</li>
        </ul>
        <p className="mt-2">La UI ya está lista para recibir una lista de alimentos con sus porciones estimadas y calcular el total.</p>
      </div>
    </div>
  );
}
