from collections import Counter
from pathlib import Path
from datetime import datetime

import spacy
from flask import Flask, jsonify, render_template, request


# ============================================================
# CONFIGURACIÓN
# ============================================================

RUTA_TEXTO = Path("data/texto.txt")
MODELO_SPACY = "es_core_news_sm"

MAX_PALABRAS = 15
LONGITUD_MINIMA = 4

TIPOS_PERMITIDOS = {
    "NOUN",   # Sustantivos
    "PROPN",  # Nombres propios
    "ADJ",    # Adjetivos
}


# ============================================================
# INICIALIZACIÓN
# ============================================================

app = Flask(__name__)

print("Cargando modelo de spaCy...")

nlp = spacy.load(MODELO_SPACY)

print("Modelo cargado correctamente.")


# ============================================================
# LECTURA Y PROCESAMIENTO
# ============================================================

def leer_texto() -> str:
    if not RUTA_TEXTO.exists():
        RUTA_TEXTO.write_text("", encoding="utf-8")

    return RUTA_TEXTO.read_text(encoding="utf-8")

def agregar_texto(nuevo_texto: str) -> None:
    nuevo_texto = nuevo_texto.strip()

    if not nuevo_texto:
        return

    texto_actual = leer_texto().strip()

    if texto_actual:
        contenido = f"{texto_actual}\n{nuevo_texto}"
    else:
        contenido = nuevo_texto

    RUTA_TEXTO.write_text(
        contenido,
        encoding="utf-8"
    )

def agregar_transcripcion(texto:str) -> None:
    texto = texto.strip()

    if not texto:
        return
    
    with RUTA_TEXTO.open("a", encoding = "utf-8") as archivo:
        archivo.write(f"\n{texto}")

def procesar_texto() -> dict:
    texto = leer_texto()

    if not texto.strip():
        return {
            "actualizado_en": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "total_conceptos": 0,
            "palabras": [],
        }

    doc = nlp(texto.lower())

    terminos = []

    for token in doc:
        lema = token.lemma_.strip().lower()

        if (
            token.pos_ in TIPOS_PERMITIDOS
            and not token.is_stop
            and not token.is_punct
            and not token.is_space
            and token.is_alpha
            and len(lema) >= LONGITUD_MINIMA
        ):
            terminos.append(lema)

    frecuencias = Counter(terminos)
    palabras_mas_comunes = frecuencias.most_common(MAX_PALABRAS)

    if not palabras_mas_comunes:
        return {
            "actualizado_en": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "total_conceptos": 0,
            "palabras": [],
        }

    frecuencia_maxima = palabras_mas_comunes[0][1]

    palabras = []

    for palabra, frecuencia in palabras_mas_comunes:
        palabras.append(
            {
                "texto": palabra.upper(),
                "frecuencia": frecuencia,
                "peso": round(frecuencia / frecuencia_maxima, 6),
            }
        )

    return {
        "actualizado_en": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "total_conceptos": len(palabras),
        "palabras": palabras,
    }


# ============================================================
# RUTAS
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/datos")
def datos():
    return jsonify(procesar_texto())

@app.route("/transcripcion", methods=["POST"])
def transcripcion():
    contenido = request.get_json(silent = True) or{}
    texto = str(contenido.get("texto", "")).strip()

    if not texto:
        return jsonify({
            "ok": False,
            "mensaje": "No se recibió texto."
        }), 400
    
    agregar_transcripcion(texto)

    print(f"Transcripción recibida: {texto}")

    return jsonify({
        "ok": True,
        "texto": texto
    })

@app.route("/limpiarPantalla", methods=["POST"])
def limpiarPantalla():
    RUTA_TEXTO.write_text("", encoding="utf-8")

    print("Archivo text.txt limpiado.")

    return jsonify({
        "ok": True,
        "mensaje": "La nube fue limpiada."
    })

# ============================================================
# EJECUCIÓN
# ============================================================

if __name__ == "__main__":
    print()
    print("==============================================")
    print(" Nube de palabras iniciada")
    print(" Abre en el navegador: http://localhost:5000")
    print(" Presiona Ctrl+C para detener el servidor")
    print("==============================================")
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        threaded=True,
    )