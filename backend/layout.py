import networkx as nx
import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import smacof
import math

def fdp(G, k):
    for edge in list(G.edges):
        G.edges[edge]['layout_weight'] = 2 / (1 + pow(math.e, -(G.edges[edge]['triCount'] + math.log(k))))
    pos = nx.spring_layout(G,
                           # pos=pos,
                           weight="layout_weight",
                           seed=1013,
                           # iterations=50
                           )
    return pos

def stress_majorization(G):
    n = G.number_of_nodes()
    geodesic_distances = dict(nx.all_pairs_shortest_path_length(G))
    distances = np.zeros([n, n])
    for i in geodesic_distances:
        for j in geodesic_distances[i]:
            if geodesic_distances[i][j] == 1:
                src = i
                tgt = j
                x = G.edges[src, tgt]['triCount']
                distances[G.nodes[i]["index"]][G.nodes[j]["index"]] = 2/(1+pow(math.e, -x))
            else:
                distances[G.nodes[i]["index"]][G.nodes[j]["index"]] = geodesic_distances[i][j]
            # distances[G.nodes[i]["index"]][G.nodes[j]["index"]] = geodesic_distances[i][j]

    [coors, stress] = smacof(
        # n_init=3,
        # max_iter=100,
        dissimilarities=distances,
        n_jobs=12,
        eps=1e-1
    )

    _min = np.min(coors, axis=0)
    print(_min)
    _max = np.max(coors, axis=0)
    print(_max)
    _range = _max - _min

    # for i, x in enumerate(coors):
    #     pos[list(graph.nodes)[i]] = x
    pos = {}
    nodes_list = list(G.nodes)
    for i, coor in enumerate(coors):
        pos[nodes_list[i]] = [(coor[0]-_min[0])/_range[0], (coor[1]-_min[1])/_range[1]]

    return pos









