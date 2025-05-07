from flask import Flask, jsonify
import psycopg2
import os

app = Flask(__name__)

# URL de tu base de datos de Render
DATABASE_URL = os.environ.get('DATABASE_URL')

def query_db(query):
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()

@app.route("/estado")
def estado():
    # Consultas
    pedidos = query_db("SELECT sabor, COUNT(*) FROM pedidos GROUP BY sabor;")
    hechos = query_db("SELECT sabor, COUNT(*) FROM hechos GROUP BY sabor;")
    total_hechos = query_db("SELECT COUNT(*) FROM hechos;")[0][0]
    total_defectuosos = query_db("SELECT COUNT(*) FROM defectuosos;")[0][0]

    # Formateo
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
