import fetch from "node-fetch";

console.log("Probando conexión a https://ve.dolarapi.com/v1/dolares ...");

async function test() {
    try {
        const response = await fetch("https://ve.dolarapi.com/v1/dolares");
        console.log("Status:", response.status);

        if (!response.ok) {
            console.error("Error de respuesta:", response.statusText);
            const text = await response.text();
            console.error("Cuerpo del error:", text);
            return;
        }

        const data = await response.json();
        console.log("Datos recibidos (tipo):", Array.isArray(data) ? "Array" : typeof data);

        if (Array.isArray(data)) {
            const oficial = data.find(d => d.fuente === 'oficial');
            if (oficial) {
                console.log("✅ Dólar Oficial encontrado:", oficial.promedio);
                console.log("Objeto completo:", JSON.stringify(oficial, null, 2));
            } else {
                console.warn("⚠️ No se encontró la fuente 'oficial' en el array.");
                console.log("Datos:", JSON.stringify(data, null, 2));
            }
        } else {
            console.log("⚠️ La respuesta no es un array:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("❌ Error de conexión:", error.message);
        if (error.cause) console.error("Causa:", error.cause);
    }
}

test();
