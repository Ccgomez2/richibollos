// Crear cliente MQTT con ID único
const clientID = "webclient_" + Math.floor(Math.random() * 100000);
const client = new Paho.MQTT.Client("broker.emqx.io", 8084, "/mqtt", clientID);

// Conexión al broker
client.connect({
  onSuccess: onConnect,
  useSSL: true,
  onFailure: err => console.error("Error al conectar:", err)
});

// Se ejecuta cuando se establece conexión con el broker
function onConnect() {
  console.log("Conectado a broker MQTT EMQX");
  client.subscribe("richi5/giirob/esp32/enviar");
  // Activamos el envío del formulario solo si estamos conectados
  document.getElementById("pedidoForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const sabor = document.getElementById("sabor").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);

    if (!nombre || !sabor || isNaN(cantidad)) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const jsonPedido = {
      evento: "nuevo_pedido",
      nombre: nombre,
      sabor: sabor,
      cantidad: cantidad
    };

    const message = new Paho.MQTT.Message(JSON.stringify(jsonPedido));
    message.destinationName = "richi5/giirob/esp32/recibir";
    client.send(message);

        // También enviamos los datos al backend para guardar en la base de datos
    fetch("/pedido", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `nombre=${encodeURIComponent(nombre)}&sabor=${encodeURIComponent(sabor)}&cantidad=${cantidad}`
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error al guardar en base de datos");
      }
      return response.text();
    })
    .then(data => {
      console.log("🗃️ Pedido guardado en la base de datos:", data);
    
     // Actualizar contadores tras guardar en base de datos
    fetch("/estado")
      .then(res => res.json())
      .then(data => {
        document.getElementById("pedidos-fresa").textContent = data.fresa.pedidos;
        document.getElementById("pedidos-vainilla").textContent = data.vainilla.pedidos;
        document.getElementById("pedidos-chocolate").textContent = data.chocolate.pedidos;
    
        document.getElementById("hechos-fresa").textContent = data.fresa.hechos;
        document.getElementById("hechos-vainilla").textContent = data.vainilla.hechos;
        document.getElementById("hechos-chocolate").textContent = data.chocolate.hechos;
    
        document.getElementById("hechos").textContent = data.total.hechos;
        document.getElementById("defectuosos").textContent = data.total.defectuosos;
      })
      .catch(err => console.error("❌ Error al actualizar contadores desde /estado:", err));

    })

    .catch(err => {
      console.error("Error guardando en base de datos:", err);
    });
   
    const submitButton = document.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";
    
    setTimeout(() => {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar";
    }, 2000);

    console.log("📤 Pedido enviado:", jsonPedido);
    alert("¡Pedido enviado con éxito!");

  
  client.onMessageArrived = function (message) {
  const data = JSON.parse(message.payloadString);
  if (data.evento === "actualizar_contadores") {
    document.getElementById("pedidos-fresa").textContent = data.fresa || 0;
    document.getElementById("pedidos-vainilla").textContent = data.vainilla || 0;
    document.getElementById("pedidos-chocolate").textContent = data.chocolate || 0;
    document.getElementById("defectuosos").textContent = data.defectuosos || 0;
    document.getElementById("hechos").textContent = data.total || 0;
  }
};
  });
}

setInterval(() => {
  fetch("/estado")
    .then(res => res.json())
    .then(data => {
      document.getElementById("pedidos-fresa").textContent = data.fresa.pedidos;
      document.getElementById("pedidos-vainilla").textContent = data.vainilla.pedidos;
      document.getElementById("pedidos-chocolate").textContent = data.chocolate.pedidos;
      document.getElementById("hechos-fresa").textContent = data.fresa.hechos;
      document.getElementById("hechos-vainilla").textContent = data.vainilla.hechos;
      document.getElementById("hechos-chocolate").textContent = data.chocolate.hechos;
      document.getElementById("hechos").textContent = data.total.hechos;
      document.getElementById("defectuosos").textContent = data.total.defectuosos;
    })
    .catch(err => console.error("❌ Error en actualización periódica:", err));
}, 10000); // cada 10 segundos

