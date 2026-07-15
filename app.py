import json
from collections import Counter
from datetime import datetime
from pathlib import Path

import spacy
from flask import Flask, jsonify, render_template, request


# ============================================================
# CONFIGURACIÓN
# ============================================================

RUTA_DATOS = Path("data")
RUTA_TEXTO = RUTA_DATOS / "texto.txt"
RUTA_PALABRAS = RUTA_DATOS / "palabras.json"

MODELO_SPACY = "es_core_news_sm"

MAX_PALABRAS = 80
LONGITUD_MINIMA = 5

TIPOS_PERMITIDOS = {
    "NOUN",   # Sustantivos
    "PROPN",  # Nombres propios
    "ADJ",    # Adjetivos
}


# ============================================================
# INICIALIZACIÓN
# ============================================================

app = Flask(__name__)

RUTA_DATOS.mkdir(
    parents=True,
    exist_ok=True
)

print("Cargando modelo de spaCy...")

nlp = spacy.load(MODELO_SPACY)

print("Modelo cargado correctamente.")


# ============================================================
# LECTURA Y ESCRITURA
# ============================================================

def leer_texto() -> str:
    if not RUTA_TEXTO.exists():
        RUTA_TEXTO.write_text(
            "",
            encoding="utf-8"
        )

    return RUTA_TEXTO.read_text(
        encoding="utf-8"
    )


def agregar_transcripcion(texto: str) -> None:
    texto = texto.strip()

    if not texto:
        return

    texto_actual = leer_texto()

    separador = ""

    if texto_actual and not texto_actual.endswith("\n"):
        separador = "\n"

    with RUTA_TEXTO.open(
        "a",
        encoding="utf-8"
    ) as archivo:
        archivo.write(
            f"{separador}{texto}"
        )


def guardar_resultado(resultado: dict) -> None:
    ruta_temporal = RUTA_PALABRAS.with_suffix(
        ".tmp"
    )

    ruta_temporal.write_text(
        json.dumps(
            resultado,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )

    ruta_temporal.replace(
        RUTA_PALABRAS
    )


def leer_resultado_guardado() -> dict:
    if not RUTA_PALABRAS.exists():
        resultado = procesar_texto()
        guardar_resultado(resultado)

        return resultado

    try:
        contenido = RUTA_PALABRAS.read_text(
            encoding="utf-8"
        )

        return json.loads(contenido)

    except (
        json.JSONDecodeError,
        OSError
    ):
        print(
            "No se pudo leer palabras.json. "
            "Se regenerará."
        )

        resultado = procesar_texto()
        guardar_resultado(resultado)

        return resultado


# ============================================================
# PROCESAMIENTO
# ============================================================

def resultado_necesita_actualizacion() -> bool:
    if not RUTA_PALABRAS.exists():
        return True

    if not RUTA_TEXTO.exists():
        return False

    return (
        RUTA_TEXTO.stat().st_mtime
        > RUTA_PALABRAS.stat().st_mtime
    )

def crear_resultado_vacio() -> dict:
    return {
        "actualizado_en": datetime.now().strftime(
            "%d/%m/%Y %H:%M:%S"
        ),
        "total_conceptos": 0,
        "palabras": [],
    }


def procesar_texto() -> dict:
    texto = leer_texto()

    if not texto.strip():
        return crear_resultado_vacio()

    print("Procesando texto con spaCy...")

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

    palabras_mas_comunes = frecuencias.most_common(
        MAX_PALABRAS
    )

    if not palabras_mas_comunes:
        return crear_resultado_vacio()

    frecuencia_maxima = palabras_mas_comunes[0][1]

    palabras = []

    for palabra, frecuencia in palabras_mas_comunes:
        palabras.append(
            {
                "texto": palabra.upper(),
                "frecuencia": frecuencia,
                "peso": round(
                    frecuencia / frecuencia_maxima,
                    6
                ),
            }
        )

    resultado = {
        "actualizado_en": datetime.now().strftime(
            "%d/%m/%Y %H:%M:%S"
        ),
        "total_conceptos": len(palabras),
        "palabras": palabras,
    }

    print(
        f"Procesamiento terminado: "
        f"{len(palabras)} conceptos."
    )

    return resultado


def actualizar_resultado() -> dict:
    resultado = procesar_texto()
    guardar_resultado(resultado)

    return resultado


# ============================================================
# RUTAS
# ============================================================

@app.route("/")
def index():
    return render_template(
        "index.html"
    )


@app.route("/datos")
def datos():
    
    #Esta ruta ya no procesa texto.
    #Solo devuelve el resultado guardado.
    
    return jsonify(
        leer_resultado_guardado()
    )


@app.route(
    "/transcripcion",
    methods=["POST"]
)
def transcripcion():
    contenido = request.get_json(
        silent=True
    ) or {}

    texto = str(
        contenido.get("texto", "")
    ).strip()

    if not texto:
        return jsonify(
            {
                "ok": False,
                "mensaje": "No se recibió texto."
            }
        ), 400

    agregar_transcripcion(texto)

    print(
        f"Transcripción recibida: {texto}"
    )

    resultado = actualizar_resultado()

    return jsonify(
        {
            "ok": True,
            "texto": texto,
            "total_conceptos":
                resultado["total_conceptos"],
            "actualizado_en":
                resultado["actualizado_en"]
        }
    )


@app.route(
    "/limpiarPantalla",
    methods=["POST"]
)
def limpiar_pantalla():
    RUTA_TEXTO.write_text(
        "",
        encoding="utf-8"
    )

    resultado = crear_resultado_vacio()

    guardar_resultado(resultado)

    print(
        "Archivo data/texto.txt limpiado."
    )

    return jsonify(
        {
            "ok": True,
            "mensaje": "La nube fue limpiada."
        }
    )


# ============================================================
# EJECUCIÓN
# ============================================================

if __name__ == "__main__":
    print()

    if resultado_necesita_actualizacion():
        print(
            "El archivo de texto es nuevo o fue modificado."
        )
        print(
            "Generando data/palabras.json..."
        )

        actualizar_resultado()
    else:
        print(
            "Usando data/palabras.json existente."
        )
        print(
            "No es necesario reprocesar el texto."
        )

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