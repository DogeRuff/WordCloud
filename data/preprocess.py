archivo_entrada = "data/texto.txt"
archivo_salida = "data/texto.txt"
texto_a_eliminar = "Multimedia omitido"

with open(archivo_entrada, "r", encoding="utf-8") as archivo:
    lineas = archivo.readlines()

with open(archivo_salida, "w", encoding="utf-8") as archivo:
    for linea in lineas:
        if texto_a_eliminar not in linea:
            archivo.write(linea)

print(f"Archivo limpio generado: {archivo_salida}")