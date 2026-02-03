import fetch from "node-fetch";

console.log("Probando endpoint /dashboard/stats ...");

async function test() {
    try {
        const response = await fetch("http://localhost:5000/dashboard/stats");
        console.log("Status:", response.status);

        if (!response.ok) {
            console.error("❌ Error de respuesta:", response.statusText);
            const text = await response.text();
            console.error("Cuerpo del error:", text);
            return;
        }

        const data = await response.json();
        console.log("✅ Datos recibidos:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("❌ Error de conexión:", error.message);
        if (error.cause) console.error("Causa:", error.cause);
    }
}

test();
