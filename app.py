from flask import Flask, send_from_directory, jsonify
import psycopg2
import os

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
