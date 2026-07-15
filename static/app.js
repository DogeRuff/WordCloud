const canvas = document.getElementById("cloudCanvas");
const ctx = canvas.getContext("2d");

const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const lastUpdate = document.getElementById("lastUpdate");
const wordCount = document.getElementById("wordCount");
const emptyMessage = document.getElementById("emptyMessage");

const microphoneButton =
    document.getElementById("microphoneButton");

const clearButton =
    document.getElementById("clearButton");

const transcriptionText =
    document.getElementById("transcriptionText");

const CONFIG = {
    intervaloActualizacion: 2000,
    maxPixelRatio: 1.5,
    maxPalabras: 80,
    margenSuperior: 130,
    margenInferior: 70,
    margenLateral: 60,
    velocidadFlotacion: 0.0005,
    //brilloBase: 10
};

let ancho = 0;
let alto = 0;
let pixelRatio = 1;

let palabras = [];
let firmaActual = "";

let reconocimiento = null;
let microfonoActivo = false;
let reinicioAutomatico = false;

const colores = [
    
    "128, 35, 70",
    "107, 107, 107",
    "201, 169, 119",
    "12, 58, 91"
];

function configurarReconocimientoVoz() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        microphoneButton.disabled = true;
        microphoneButton.textContent =
            "Reconocimiento no disponible";

        transcriptionText.textContent =
            "Este navegador no soporta reconocimiento de voz.";

        return;
    }

    reconocimiento = new SpeechRecognition();

    reconocimiento.lang = "es-MX";
    reconocimiento.continuous = true;
    reconocimiento.interimResults = true;
    reconocimiento.maxAlternatives = 1;

    reconocimiento.onstart = () => {
        microfonoActivo = true;

        microphoneButton.textContent =
            "Detener micrófono";

        microphoneButton.classList.add("activo");

        transcriptionText.textContent =
            "Escuchando...";
    };

    reconocimiento.onresult = async (evento) => {
        let textoProvisional = "";
        let textoFinal = "";

        for (
            let indice = evento.resultIndex;
            indice < evento.results.length;
            indice++
        ) {
            const resultado = evento.results[indice];
            const texto = resultado[0].transcript.trim();

            if (resultado.isFinal) {
                textoFinal += `${texto} `;
            } else {
                textoProvisional += `${texto} `;
            }
        }

        if (textoProvisional.trim()) {
            transcriptionText.textContent =
                textoProvisional.trim();
        }

        if (textoFinal.trim()) {
            const frase = textoFinal.trim();

            transcriptionText.textContent = frase;

            await enviarTranscripcion(frase);
        }
    };

    reconocimiento.onerror = (evento) => {
        console.error(
            "Error de reconocimiento:",
            evento.error
        );

        if (evento.error === "not-allowed") {
            transcriptionText.textContent =
                "Chrome no tiene permiso para usar el micrófono.";

            reinicioAutomatico = false;
        } else if (evento.error === "no-speech") {
            transcriptionText.textContent =
                "No se detectó voz.";
        } else if (evento.error === "network") {
            transcriptionText.textContent =
                "Error de red en el reconocimiento.";
        } else {
            transcriptionText.textContent =
                `Error de micrófono: ${evento.error}`;
        }
    };

    reconocimiento.onend = () => {
        microfonoActivo = false;

        if (reinicioAutomatico) {
            try {
                reconocimiento.start();
                return;
            } catch (error) {
                console.error(
                    "No se pudo reiniciar:",
                    error
                );
            }
        }

        microphoneButton.textContent =
            "Iniciar micrófono";

        microphoneButton.classList.remove("activo");
    };
}

async function enviarTranscripcion(texto) {
    try {
        const respuesta = await fetch(
            "/transcripcion",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    texto: texto
                })
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        const resultado = await respuesta.json();

        console.log(
            "Transcripción guardada:",
            resultado.texto
        );

        await cargarDatos();
    } catch (error) {
        console.error(
            "No se pudo enviar la transcripción:",
            error
        );

        transcriptionText.textContent =
            "No se pudo guardar la transcripción.";
    }
}
async function limpiarPantalla(){
    try {
        clearButton.disabled = true;
        clearButton.textContent = "Limpiando...";

        const respuesta = await fetch(
            "/limpiarPantalla",
            {
                method: "POST"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        palabras = [];
        firmaActual = "";

        emptyMessage.classList.remove("oculto");

        transcriptionText.textContent =
            "La transcripción fue limpiada.";

        await cargarDatos();
    }
    catch (error) {
        console.error(
            "No se pudo limpiar la pantalla:",
            error
        );

        transcriptionText.textContent =
            "No se pudo limpiar la pantalla.";
    }
    finally {
        clearButton.disabled = false;
        clearButton.textContent =
            "Limpiar pantalla";
    }
}
function alternarMicrofono() {
    if (!reconocimiento) {
        return;
    }

    if (microfonoActivo || reinicioAutomatico) {
        reinicioAutomatico = false;

        reconocimiento.stop();

        microphoneButton.textContent =
            "Iniciar micrófono";

        microphoneButton.classList.remove("activo");

        transcriptionText.textContent =
            "Micrófono detenido";

        return;
    }

    reinicioAutomatico = true;

    try {
        reconocimiento.start();
    } catch (error) {
        console.error(
            "No se pudo iniciar el micrófono:",
            error
        );
    }
}

function ajustarCanvas() {
    ancho = window.innerWidth;
    alto = window.innerHeight;

    pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        CONFIG.maxPixelRatio
    );

    canvas.width = Math.floor(ancho * pixelRatio);
    canvas.height = Math.floor(alto * pixelRatio);

    canvas.style.width = `${ancho}px`;
    canvas.style.height = `${alto}px`;

    ctx.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
    );

    if (palabras.length > 0) {
        prepararPalabras(
            palabras.map((palabra) => ({
                texto: palabra.texto,
                frecuencia: palabra.frecuencia,
                peso: palabra.peso
            }))
        );
    }
}


function hashTexto(texto) {
    let hash = 0;

    for (let i = 0; i < texto.length; i++) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
}


function calcularTamano(peso) {
    const minimo = Math.max(18, ancho * 0.012);
    const maximo = Math.min(92, ancho * 0.052);

    return minimo + Math.pow(peso, 0.72) * (maximo - minimo);
}


function medirTexto(texto, tamano) {
    ctx.font = `700 ${tamano}px "Montserrat", sans-serif`;

    const medida = ctx.measureText(texto);

    return {
        ancho: medida.width,
        alto: tamano * 1.15
    };
}


function seSuperpone(rectangulo, ocupados) {
    const margen = 14;

    return ocupados.some((otro) => (
        rectangulo.x < otro.x + otro.ancho + margen &&
        rectangulo.x + rectangulo.ancho + margen > otro.x &&
        rectangulo.y < otro.y + otro.alto + margen &&
        rectangulo.y + rectangulo.alto + margen > otro.y
    ));
}


function encontrarPosicion(palabra, ocupados, indice) {
    const centroX = ancho / 2;

    const centroY =
        CONFIG.margenSuperior +
        (
            alto -
            CONFIG.margenSuperior -
            CONFIG.margenInferior
        ) / 2;

    const medida = medirTexto(
        palabra.texto,
        palabra.tamano
    );

    const semilla = hashTexto(palabra.texto);
    const anguloInicial = (semilla % 360) * Math.PI / 180;

    for (let intento = 0; intento < 700; intento++) {
        const angulo = anguloInicial + intento * 0.36;

        const radio =
            4.1 *
            Math.sqrt(intento) *
            (1 + indice * 0.008);

        const x =
            centroX +
            Math.cos(angulo) * radio -
            medida.ancho / 2;

        const y =
            centroY +
            Math.sin(angulo) * radio * 0.58 -
            medida.alto / 2;

        const rectangulo = {
            x,
            y,
            ancho: medida.ancho,
            alto: medida.alto
        };

        const estaDentro =
            x >= CONFIG.margenLateral &&
            x + medida.ancho <= ancho - CONFIG.margenLateral &&
            y >= CONFIG.margenSuperior &&
            y + medida.alto <= alto - CONFIG.margenInferior;

        if (
            estaDentro &&
            !seSuperpone(rectangulo, ocupados)
        ) {
            ocupados.push(rectangulo);

            return {
                x: x + medida.ancho / 2,
                y: y + medida.alto / 2
            };
        }
    }

    return {
        x:
            CONFIG.margenLateral +
            Math.random() *
            (ancho - CONFIG.margenLateral * 2),

        y:
            CONFIG.margenSuperior +
            Math.random() *
            (
                alto -
                CONFIG.margenSuperior -
                CONFIG.margenInferior
            )
    };
}


function prepararPalabras(datos) {
    const anteriores = new Map(
        palabras.map((palabra) => [
            palabra.texto,
            palabra
        ])
    );

    const ocupados = [];

    const ordenadas = [...datos]
        .sort((a, b) => b.peso - a.peso)
        .slice(0, CONFIG.maxPalabras);

    palabras = ordenadas.map((dato, indice) => {
        const tamano = calcularTamano(dato.peso);

        const posicion = encontrarPosicion(
            {
                texto: dato.texto,
                tamano
            },
            ocupados,
            indice
        );

        const anterior = anteriores.get(dato.texto);
        const semilla = hashTexto(dato.texto);

        return {
            texto: dato.texto,
            frecuencia: dato.frecuencia,
            peso: dato.peso,

            tamano,

            x: anterior ? anterior.x : ancho / 2,
            y: anterior ? anterior.y : alto / 2,

            destinoX: posicion.x,
            destinoY: posicion.y,

            opacidad: anterior ? anterior.opacidad : 0,

            fase:
                anterior
                    ? anterior.fase
                    : (semilla % 628) / 100,

            velocidad:
                0.75 +
                (semilla % 40) / 100,

            color: semilla % colores.length
        };
    });
}


function crearFirma(datos) {
    return datos
        .map((palabra) => (
            `${palabra.texto}:${palabra.frecuencia}`
        ))
        .join("|");
}


async function cargarDatos() {
    try {
        const respuesta = await fetch(
            `/datos?t=${Date.now()}`,
            {
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        const datos = await respuesta.json();
        const nuevaFirma = crearFirma(datos.palabras);

        if (nuevaFirma !== firmaActual) {
            firmaActual = nuevaFirma;
            prepararPalabras(datos.palabras);
        }

        lastUpdate.textContent =
            `Actualizado: ${datos.actualizado_en}`;

        wordCount.textContent =
            `${datos.total_conceptos} conceptos`;

        emptyMessage.classList.toggle(
            "oculto",
            datos.palabras.length > 0
        );

        statusIndicator.className =
            "estado__indicador activo";

        statusText.textContent =
            "Visualización activa";
    }
    catch (error) {
        console.error(error);

        statusIndicator.className =
            "estado__indicador error";

        statusText.textContent =
            "Error al obtener los datos";
    }
}


function colorPalabra(indice, opacidad) {
    return `rgba(${colores[indice]}, ${opacidad})`;
}


function dibujarFondo() {
    ctx.clearRect(0, 0, ancho, alto);
}


function dibujarPalabras(tiempo) {
    for (const palabra of palabras) {
        palabra.x +=
            (palabra.destinoX - palabra.x) * 0.055;

        palabra.y +=
            (palabra.destinoY - palabra.y) * 0.055;

        palabra.opacidad +=
            (1 - palabra.opacidad) * 0.04;

        const flotacionX =
            Math.sin(
                tiempo *
                CONFIG.velocidadFlotacion *
                palabra.velocidad +
                palabra.fase
            ) * 6;

        const flotacionY =
            Math.cos(
                tiempo *
                CONFIG.velocidadFlotacion *
                0.8 *
                palabra.velocidad +
                palabra.fase
            ) * 4;

        const respiracion =
            1 +
            Math.sin(
                tiempo * 0.001 +
                palabra.fase
            ) * 0.025;

        // const brillo =
        //     CONFIG.brilloBase +
        //     Math.sin(
        //         tiempo * 0.0012 +
        //         palabra.fase
        //     ) * 5;

        ctx.save();

        ctx.translate(
            palabra.x + flotacionX,
            palabra.y + flotacionY
        );

        ctx.scale(
            respiracion,
            respiracion
        );

        ctx.font =
            `700 ${palabra.tamano}px "Montserrat", sans-serif`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // ctx.shadowBlur = brillo;

        // ctx.shadowColor = colorPalabra(
        //     palabra.color,
        //     0.75
        // );

        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 3;
        ctx.shadowColor = "rgba(20, 30, 40, 0.18)";

        ctx.fillStyle = colorPalabra(
            palabra.color,
            palabra.opacidad
        );

        ctx.fillText(
            palabra.texto,
            0,
            0
        );

        ctx.restore();
    }
}


function animar(tiempo) {
    dibujarFondo();
    dibujarPalabras(tiempo);

    requestAnimationFrame(animar);
}

window.addEventListener(
    "resize",
    ajustarCanvas
);

microphoneButton.addEventListener(
    "click",
    alternarMicrofono
);

clearButton.addEventListener(
    "click",
    limpiarPantalla
);

configurarReconocimientoVoz();

ajustarCanvas();
cargarDatos();

setInterval(
    cargarDatos,
    CONFIG.intervaloActualizacion
);

requestAnimationFrame(animar);