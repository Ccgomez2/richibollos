from flask import Flask, send_from_directory, jsonify
import psycopg2
import os

from flask import request
import json
import paho.mqtt.client as mqtt


app = Flask(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL")

def query_db(query):
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/script.js")
def js():
    return send_from_directory(".", "script.js")

@app.route("/styles.css")
def css():
    return send_from_directory(".", "styles.css")

@app.route("/foto/<path:filename>")
def foto(filename):
    return send_from_directory("foto", filename)

@app.route("/estado")
def estado():
    pedidos = query_db("SELECT sabor, COUNT(*) FROM pedidos GROUP BY sabor;")
    hechos = query_db("SELECT sabor, COUNT(*) FROM hechos GROUP BY sabor;")
    total_hechos = query_db("SELECT COUNT(*) FROM hechos;")[0][0]
    total_defectuosos = query_db("SELECT COUNT(*) FROM defectuosos;")[0][0]

    data = {
        "fresa": {"pedidos": 0, "hechos": 0},
        "vainilla": {"pedidos": 0, "hechos": 0},
        "chocolate": {"pedidos": 0, "hechos": 0},
        "total": {"hechos": total_hechos, "defectuosos": total_defectuosos}
    }

    for sabor, count in pedidos:
        data[sabor]["pedidos"] = count

    for sabor, count in hechos:
        data[sabor]["hechos"] = count

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)

@app.route("/pedido", methods=["POST"])
def nuevo_pedido():
    nombre = request.form.get("nombre")
    sabor = request.form.get("sabor")
    cantidad = int(request.form.get("cantidad"))

    # Guardar en la base de datos
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO pedidos (nombre, sabor, cantidad) VALUES (%s, %s, %s)",
                (nombre, sabor, cantidad)
            )
            conn.commit()

    # Publicar mensaje MQTT
    client = mqtt.Client(transport="websockets")
    client.connect("broker.emqx.io", 8084, 60)
    client.loop_start()
    payload = json.dumps({
        "evento": "nuevo_pedido",
        "nombre": nombre,
        "sabor": sabor,
        "cantidad": cantidad
    })
    client.publish("richi5/giirob/pr2/enviar/web", payload)
    client.loop_stop()

    return "Pedido procesado correctamente"

