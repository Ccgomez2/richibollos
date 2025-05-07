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
   
    const submitButton = document.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";
    
    setTimeout(() => {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar";
    }, 2000);

    console.log("📤 Pedido enviado:", jsonPedido);
    alert("¡Pedido enviado con éxito!");

  client.subscribe("richi5/giirob/esp32/enviar");
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
