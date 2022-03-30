import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from backbone import default, get_graph, get_egonetwork, set_k

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, supports_credentials=True)

@app.route("/test", methods=["POST"])
def test():
    my_json = request.get_json()
    my_age = my_json.get("age")+1
    return jsonify(name=my_json.get("name"), age=my_age)

@app.route("/get_graph", methods=["POST"])
def get_graph_func():
    params = request.get_json() if request.method == "POST" else request.args
    if "graph_name" in params:
        graph_name = params["graph_name"]
    else:
        graph_name = default["graph_name"]
    # session["graph_name"] = graph_name
    res = get_graph(graph_name)
    return jsonify(res)

@app.route("/get_egonetwork", methods=["POST"])
def get_egonetwork_func():
    params = request.get_json() if request.method == "POST" else request.args
    if "graph_name" in params:
        graph_name = params["graph_name"]
    else:
        graph_name = default["graph_name"]
    if "node_id" not in params:
        node_id = 0
    else:
        node_id = int(params["node_id"])
    # graph_name = session.get('graph_name')
    res = get_egonetwork(graph_name, node_id)
    return jsonify(res)

@app.route("/set_k", methods=["POST"])
def set_k_func():
    params = request.get_json() if request.method == "POST" else request.args
    if "graph_name" in params:
        graph_name = params["graph_name"]
    else:
        graph_name = default["graph_name"]
    if "k" not in params:
        k = 2
    else:
        k = int(params["k"])
    # graph_name = session.get('graph_name')
    res = set_k(graph_name, k)
    return jsonify(res)

if __name__ == '__main__':
    app.run(
        host='localhost',
        port=5000,
        debug=True
    )
