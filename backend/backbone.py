import json
import pathlib
import time
import networkx as nx
from networkx.algorithms import community
import numpy as np
import os
import copy
import matplotlib.pyplot as plt
import random
import pandas as pd
from multiprocessing.dummy import Pool as ThreadPool
from layout import stress_majorization, fdp
from networkx.readwrite import json_graph
from scipy.cluster import hierarchy
import math
base_dir = os.path.abspath(os.path.dirname(__file__))
default = {
    # "graph_name": "Auburn71"
    # "graph_name": "Rice31"
    # "graph_name": "miserables"
    # "graph_name": "Smith60"
    "graph_name": "Caltech36"
    # "graph_name": "Harvard1"
    # "graph_name": "email-Eu-core"
    # "graph_name": "Wiki-Vote"
}
maxTrussness = 2
clusterMap = {}  # cluster: cluster_size
clusterArray = [] #ranked by size
G = {}
trCntV_G = {} #number of triangles containing node v
deg_G = {} #set of degree of node v
trE_G = {} #set of triangles containing edge e
kAddEdges = {} # {k: #add_edges}
kTriangleMap = {}
Cv_G = {}
default_k = 0
def get_graphData(graph):
    graphData = {"nodes": [], "links": []}
    for node in list(graph.nodes):
        G_node = graph.nodes[node]
        graphData["nodes"].append({
            "id": node,
            "attributes": {
                "x": G_node["x"],
                "y": G_node["y"],
                "cluster": G_node["cluster"]
            }
        })
    for edge in list(graph.edges):
        [src, tgt] = edge
        G_edge = graph.edges[src, tgt]
        graphData["links"].append({
            "source": src,
            "source_cluster": graph.nodes[src]["cluster"],
            "target": tgt,
            "target_cluster": graph.nodes[tgt]["cluster"],
            "attributes": {
                "trussness": G_edge["trussness"]
            }
        })
    return graphData

def get_graphDataFile(graph):
    graphData = {"nodes": [], "links": []}
    for node in list(graph.nodes):
        G_node = graph.nodes[node]
        if "x" in G_node:
            graphData["nodes"].append({
                "id": node,
                "index": G_node["index"],
                "x": G_node["x"],
                "y": G_node["y"],
                "cluster": G_node["cluster"]
            })
        else:
            graphData["nodes"].append({
                "id": node,
                "index": G_node["index"],
                "cluster": G_node["cluster"]
            })
    for edge in list(graph.edges):
        [src, tgt] = edge
        G_edge = graph.edges[src, tgt]
        graphData["links"].append({
            "source": src,
            "source_cluster": graph.nodes[src]["cluster"],
            "target": tgt,
            "target_cluster": graph.nodes[tgt]["cluster"],
            "triCount": G_edge["triCount"],
            "is_removed": G_edge["is_removed"],
            "is_added": G_edge["is_added"],
            "trussness": G_edge["trussness"]
        })
    return graphData

def get_graph(graph_name):
    print("graph_name: "+graph_name)
    total_start_time = time.time()
    global G
    start_time = time.time()
    # 判断该图是否被预处理过,若被预处理过，直接返回结果
    if pathlib.Path(base_dir + "/graph_process/" + graph_name + "Graph.json").exists():
        with open(base_dir + "/graph_process/" + graph_name + "Graph.json", "r") as load_f:
            result = json.load(load_f)
            print("返回预处理数据")
            return result
    G = read_graph(graph_name)
    init_graph(G)

    end_time = time.time()
    print("初始化用时：", str(end_time - start_time)+"s")
    clear_graph(G, graph_name)
    start_time = time.time()
    reconstruct_graph(G)
    end_time = time.time()
    print("重建backbone用时：", str(end_time - start_time)+"s")
    #
    # 真正删除G中的边
    backbone_graph = copy.deepcopy(G)
    remove_edges = []
    for edge in list(backbone_graph.edges):
        if backbone_graph.edges[edge]["is_removed"] and not backbone_graph.edges[edge]["is_added"]:
            remove_edges.append(edge)
    backbone_graph.remove_edges_from(remove_edges)

    start_time = time.time()
    # 计算stress majorization
    backbone_graph = largest_cc(backbone_graph)
    # pos = fdp(G)
    pos_backbone = fdp(backbone_graph, default_k)
    layout(backbone_graph, pos_backbone)
    # layout(G, pos)
    end_time = time.time()
    print("布局用时：", str(end_time - start_time)+"s")
    print("总用时：", str(end_time - total_start_time)+"s")
    # 封装成前端需要的格式
    graphData = get_graphData(backbone_graph)
    graphDataFile = get_graphDataFile(backbone_graph)
    original_graphDataFile = get_graphDataFile(G)
    result = {
        "graphData": graphData,
        "graphDataFile": graphDataFile,
        "original_graphDataFile": original_graphDataFile,
        "clusterArray": clusterArray,
        "maxTrussness": maxTrussness,
        "clusterMap": clusterMap,
        "default_k": default_k,
        "k_add_edges": kAddEdges,
        "kTriangleMap": kTriangleMap
    }
    with open(base_dir + '/graph_process/' + graph_name + "Graph.json", "w") as f:
        print("写入文件")
        json.dump(result, f)
    return {
        "graphData": graphData,
        "clusterArray": clusterArray,
        "maxTrussness": maxTrussness,
        "clusterMap": clusterMap,
        "default_k": default_k,
        "k_add_edges": kAddEdges,
    }

def init_graph(G):
    set_nodes(G)
    start_time = time.time()
    set_edges(G)
    end_time = time.time()
    print("set_edges用时：", str(end_time - start_time) + "s")
    start_time = time.time()
    set_trussness(G)
    end_time = time.time()
    print("set_trussness用时：", str(end_time - start_time) + "s")

def set_nodes(G): #计算deg、Cv和trCntV
    global deg_G
    global trCntV_G
    for i, node in enumerate(list(G.nodes)):
        G.nodes[node]["index"] = i
        # 计算deg
        deg_G[node] = G.degree[node]
        # 计算trCntV
        trCntV_G[node] = 0
        neighbors = list(set(G.neighbors(node)))
        neighborCnt = len(neighbors)
        # 遍历邻居
        for i in range(neighborCnt-1):
            for j in range(i + 1, neighborCnt):
                if G.has_edge(neighbors[i], neighbors[j]):
                    trCntV_G[node] += 1

    for node in list(G.nodes):
        # 计算Cv
        Cv_G[node] = compute_cv(deg_G[node], trCntV_G[node])

def compute_cv(_deg, _trCntV): # 计算Cv
    tau = _deg * (_deg-1) / 2
    if tau == 0:
        return 0
    else:
        return _trCntV / tau

def get_egonetwork(graph_name, node_id):
    try:
        with open(base_dir + '/graph_process/' + graph_name + "Graph.json", "r") as load_f:
            data = json.load(load_f)
            graph = nx.node_link_graph(data["graphDataFile"])
            hub_ego = nx.ego_graph(graph, node_id)
            graphData = {"nodes": [], "links": []}
            for node in list(hub_ego.nodes):
                attributes = hub_ego.nodes[node]
                graphData["nodes"].append({
                    "id": node,
                    "attributes": attributes})
            for edge in list(hub_ego.edges):
                [src, tgt, x] = edge
                graphData["links"].append({
                    "source": src,
                    "source_cluster": hub_ego.edges[edge]["source_cluster"],
                    "target": tgt,
                    "target_cluster": hub_ego.edges[edge]["target_cluster"],
                    "attributes": hub_ego.edges[edge]})
            return graphData
    except FileNotFoundError:
        print("请先初始化图！")

def set_edges(G): #计算每条边的wight和trE_G
    global trE_G
    # 1.初始化weight
    # 先数三角形
    for edge in list(G.edges):
        [src, tgt] = edge
        srcNeighbors = set(G.neighbors(src))
        tgtNeighbors = set(G.neighbors(tgt))
        triangles = srcNeighbors & tgtNeighbors
        triCount = len(triangles)
        G.edges[src, tgt]['triCount'] = triCount
        G.edges[src, tgt]['is_removed'] = False
        G.edges[src, tgt]['is_added'] = False
        trE_G[edge] = {"src": src, "tgt": tgt, "triangles": triangles}
    # 再初始化weight
    for edge in list(G.edges):
        [src, tgt] = edge
        if G.edges[src, tgt]['triCount'] == 0:
            G.edges[src, tgt]['weight'] = 0
            continue
        srcTriCount = 0
        tgtTriCount = 0
        for neighbor in list(G.neighbors(src)):
            srcTriCount += G.edges[src, neighbor]['triCount']
        for neighbor in list(G.neighbors(tgt)):
            tgtTriCount += G.edges[tgt, neighbor]['triCount']
        G.edges[src, tgt]['weight'] = G.edges[src, tgt]['triCount'] ** 2 / (srcTriCount * tgtTriCount)

    # 2.reweight:
    _G = copy.deepcopy(G)
    for edge in list(_G.edges):
        [src, tgt] = edge
        srcNeighbors = set(_G.neighbors(src))
        tgtNeighbors = set(_G.neighbors(tgt))
        #1.按初始权值将边两端点的邻居分别排序（从大到小）
        srcNeighbors_sorted = sorted(list(srcNeighbors), key=lambda x: _G.edges[src, x]["weight"], reverse=True)
        tgtNeighbors_sorted = sorted(list(tgtNeighbors), key=lambda x: _G.edges[tgt, x]["weight"], reverse=True)
        #2.求解Jaccard系数并找出新权值
        lenSrc = len(srcNeighbors_sorted)
        lenTgt = len(tgtNeighbors_sorted)
        kMax = lenSrc if lenSrc < lenTgt else lenTgt
        jMax = -1
        srcs = set()
        tgts = set()
        for k in range(kMax):
            srcs.add(srcNeighbors_sorted[k])
            tgts.add(tgtNeighbors_sorted[k])
            size_intersection = len(srcs & tgts)
            size_union = len(srcs)+len(tgts) - size_intersection
            jaccard_coefficient = size_intersection / size_union
            if jMax < jaccard_coefficient:
                jMax = jaccard_coefficient
        G.edges[src, tgt]["weight"] = jMax
    # nx.draw_networkx_edges(G, pos=nx.spring_layout(G), edge_color=[G.edges[i[0], i[1]]["weight"] for i in list(G.edges)], edge_cmap=plt.cm.Reds, edge_vmin=0, edge_vmax=1)
    # plt.show()

    # 3. 把更新后的weight赋值给trE_G
    for edge in list(G.edges):
        trE_G[edge]["weight"] = G.edges[edge]["weight"]
    # 对trE_G按weight从小到大排序
    trE_G = {k: v for k, v in sorted(trE_G.items(), key=lambda item: item[1]["weight"], reverse=False)}

def get_dorm(G, graph_name):
    # communities = []
    # 1.读取excel中的dorm列
    df = pd.read_excel(base_dir + "/graph_data/" + graph_name + "_local_info.xlsx", usecols=[4], header=None)
    list = df.values.tolist()
    dorm_list = []
    for li in list:
        dorm_list.append(li[0])
    print(dorm_list)
    # 2.将dorm相同的node_id放在同一个list中，并转存到communities中返回
    dorm_dict = {}
    for index, node_id in enumerate(G.nodes):
        dorm_id = str(dorm_list[index])
        if dorm_id in dorm_dict.keys():
            dorm_dict[dorm_id].append(node_id)
        else:
            dorm_dict[dorm_id] = []
            dorm_dict[dorm_id].append(node_id)
    # for key, value in dorm_dict.items():
    #     communities.append(frozenset(value))
    return dorm_dict

def clear_graph(G, graph_name):
    global clusterArray
    global clusterMap
    # 1.计算聚类系数
    start_time = time.time()
    remove_ebunch = compute_clustering_coefficient(G)
    end_time = time.time()
    print("全局抽backbone用时：", str(end_time - start_time)+"s")
    # 2.从全局图中删边
    g_clear = copy.deepcopy(G)
    g_clear.remove_edges_from(remove_ebunch)

    # 3.对所有点进行社团检测,并将社团编号写入图中，并获得所有社团子图
    start_time = time.time()
    subgraph_list = []
    if graph_name == "Rice31" or graph_name == "Auburn71" or graph_name == "Caltech36" or graph_name == "Harvard1" or graph_name == "Smith60":
        dict = get_dorm(g_clear, graph_name)
        for cluster_id, cluster in dict.items():
            clusterMap[cluster_id] = nodes_reordering(cluster)
            subgraph_list.append(G.subgraph(cluster))
            for index in range(len(cluster)):
                node_id = cluster[index]
                G.nodes[node_id]['cluster'] = cluster_id
        clusterMap[-1] = nodes_reordering(list(G.nodes))
    else:
        communities = community.greedy_modularity_communities(g_clear)
        communities_list = list(communities)
        for i in range(len(communities_list)):
            community_i = list(communities_list[i])
            clusterMap[i] = community_i
            subgraph_list.append(G.subgraph(community_i))
            for j in range(len(community_i)):
                node_id = community_i[j]
                G.nodes[node_id]["cluster"] = i
        clusterMap = {cluster_id: nodes_reordering(cluster) for cluster_id, cluster in clusterMap.items()}
        clusterMap[-1] = nodes_reordering(list(G.nodes))
    end_time = time.time()
    print("检测到"+str(len(clusterMap.keys()))+"个社团，用时：", str(end_time - start_time)+"s")


    clusterArray = [{"cluster_id": k, "cluster_size": len(v)} for k, v in sorted(clusterMap.items(), key=lambda item: len(item[1]), reverse=True)]
    # 4.子图并行重复1-3步处理，得出最终结果
    start_time = time.time()
    pool = ThreadPool()
    pool.map(compute_clustering_coefficient, subgraph_list)
    pool.close()
    pool.join
    # for subgraph in subgraph_list:
    #     compute_clustering_coefficient(subgraph)
    end_time = time.time()
    print("子图抽backone用时：", str(end_time - start_time)+"s")

def compute_clustering_coefficient(g):
    n = g.number_of_nodes()
    m = g.number_of_edges()

    if m==0: return

    # 初始化deg
    deg = copy.deepcopy(deg_G)
    # 初始化trCntV
    trCntV = copy.deepcopy(trCntV_G)
    # 初始化Cv
    Cv = copy.deepcopy(Cv_G)
    # Cv = {}
    # for node in list(g.nodes):
    #     Cv[node] = copy.deepcopy(Cv_G[node])

    # 初始化trE
    trE = {}
    for edge in list(g.edges):
        [src, tgt] = edge
        if (src, tgt) in trE_G:
            trE[edge] = copy.deepcopy(trE_G[(src, tgt)])
        else:
            trE[edge] = copy.deepcopy(trE_G[(tgt, src)])

    # 对trE按weight从小到大排序
    trE = {k: v for k, v in sorted(trE.items(), key=lambda item: item[1]["weight"], reverse=False)}
    w0 = trE[list(trE.keys())[0]]["weight"]


    # 当前的global Clustering Coefficient
    Ct = np.mean(list(Cv.values()))
    C = [{"value": Ct, "edge_ix": 0}]

    # 计算global clustering cofficient
    edge_ix = 0
    for key in trE:
        edge_ix += 1
        edge = trE[key]
        src = edge['src']
        tgt = edge['tgt']
        triangles = edge['triangles']
        Ct -= (Cv[src]+Cv[tgt]) / n
        trCntV[src] -= len(triangles)
        trCntV[tgt] -= len(triangles)
        deg[src] -= 1
        deg[tgt] -= 1
        Cv[src] = compute_cv(deg[src], trCntV[src])
        Cv[tgt] = compute_cv(deg[tgt], trCntV[tgt])
        Ct += (Cv[src]+Cv[tgt]) / n
        for triangle in triangles:
            Ct -= Cv[triangle] / n
            trCntV[triangle] -= 1
            Cv[triangle] = compute_cv(deg[triangle], trCntV[triangle])
            Ct += Cv[triangle] / n
            if (src, triangle) in trE:
                trE[(src, triangle)]["triangles"].remove(tgt)
            elif (triangle, src) in trE:
                trE[(triangle, src)]["triangles"].remove(tgt)
            if (tgt, triangle) in trE:
                trE[(tgt, triangle)]["triangles"].remove(src)
            elif (triangle, tgt) in trE:
                trE[(triangle, tgt)]["triangles"].remove(src)

        if edge["weight"] != w0:
            C.append({"value": Ct, "edge_ix": edge_ix})
            w0 = edge["weight"]
    # plt.plot(range(len(C)), [c["value"] for c in C])
    # plt.show()

    # 从聚类系数去找极大值
    c_max = -1 # 存放聚类系数的最大值
    k = -1 # 存放最大值边的索引
    for item in C:
        if c_max < item["value"]:
            c_max = item["value"]
            k = item["edge_ix"]

    # 删去极大值之前的所有边
    remove_ebunch = list(trE.keys())[:k] if k>=0 else []
    for edge in remove_ebunch:
        G.edges[edge]["is_removed"] = True

    return remove_ebunch

def reconstruct_graph(G):
    global kAddEdges
    global kTriangleMap
    global default_k
    for i in range(2, maxTrussness+1):
        # 借用无向图，存边，防止互逆边导致的重复
        kTriangleMap[i] = nx.Graph()

    for edge in list(G.edges):
        [src, tgt] = edge
        if G.edges[edge]["is_removed"] == False:
            triangles = trE_G[edge]["triangles"]
            # 判断是否满足k-triangle
            for triangle in triangles:
                k = min([G.edges[src, tgt]["trussness"], G.edges[src, triangle]["trussness"], G.edges[tgt, triangle]["trussness"]])
                G.edges[edge]["k-triangle"] = k
                # 如果这条三角形边被删掉了，才要添加
                if G.edges[src, triangle]["is_removed"] == True:
                    kTriangleMap[k].add_edge(src, triangle)
                if G.edges[tgt, triangle]["is_removed"] == True:
                    kTriangleMap[k].add_edge(tgt, triangle)

    kTriangleMap = {k: list(v.edges) for k, v in sorted(kTriangleMap.items(), key=lambda item: item[0], reverse=True)}
    kAddEdges = {maxTrussness+1: 0}
    for k in kTriangleMap:
        kAddEdges[k] = kAddEdges[k+1]+len(kTriangleMap[k])
    added_edges = set()
    for k, edge_list in kTriangleMap.items():
        if kAddEdges[k] < 0.5*kAddEdges[2]:
            added_edges.update(edge_list)
            default_k = k
        else:
            break

    for edge in added_edges:
        G.edges[edge]["is_added"] = True


def set_k(graph_name, k):
    if pathlib.Path(base_dir + "/graph_process/" + graph_name + "Graph.json").exists():
        with open(base_dir + "/graph_process/" + graph_name + "Graph.json", "r") as load_f:
            result = json.load(load_f)
            _G = json_graph.node_link_graph(result["original_graphDataFile"])
            G = nx.Graph()
            G.add_nodes_from(_G.nodes(data=True))
            G.add_edges_from(_G.edges(data=True))
            kAddEdges = result["k_add_edges"]
            kTriangleMap = result["kTriangleMap"]
            clusterArray = result["clusterArray"]
            clusterMap = result["clusterMap"]
            maxTrussness = result["maxTrussness"]
            added_edges = set()
            for key, edge_list in kTriangleMap.items():
                if int(key) >= k:
                    added_edges.update([tuple(edge) for edge in edge_list])
                else:
                    break

            for edge in added_edges:
                G.edges[edge]["is_added"] = True

            # 真正删除边
            backbone_graph = copy.deepcopy(G)
            remove_edges = []
            for edge in list(backbone_graph.edges):
                if backbone_graph.edges[edge]["is_removed"] and not backbone_graph.edges[edge]["is_added"]:
                    remove_edges.append(edge)
            backbone_graph.remove_edges_from(remove_edges)

            start_time = time.time()
            # 计算布局
            backbone_graph = largest_cc(backbone_graph)
            pos_backbone = fdp(backbone_graph, k)
            layout(backbone_graph, pos_backbone)
            end_time = time.time()
            print("布局用时：", str(end_time - start_time) + "s")
            # 封装成前端需要的格式
            graphData = get_graphData(backbone_graph)
            return {
                "graphData": graphData,
                "clusterArray": clusterArray,
                "maxTrussness": maxTrussness,
                "clusterMap": clusterMap,
                "default_k": k,
                "k_add_edges": kAddEdges,
            }

def set_trussness(G):
    g = copy.deepcopy(G)
    edgeLen = len(list(g.edges))
    k = 2
    allRemovedEdges = 0
    while allRemovedEdges < edgeLen:
        k += 1
        removedEdges = 1  # 初始化为任意大于0的值即可
        while removedEdges > 0:
            removedEdges = 0
            for edge in list(g.edges):
                src = edge[0]
                tgt = edge[1]
                srcNeighbors = set(g.neighbors(src))
                tgtNeighbors = set(g.neighbors(tgt))
                trussness = len(srcNeighbors & tgtNeighbors)
                if trussness < k-2 and not "trussness" in G.edges[src, tgt]:
                    G.edges[src, tgt]["trussness"] = k-1
                    g.remove_edge(src, tgt)
                    removedEdges += 1
            allRemovedEdges += removedEdges
    global maxTrussness
    maxTrussness = k - 1
    # # 1.所有边的初值设为2
    # for edge in list(G.edges):
    #     src = edge[0]
    #     tgt = edge[1]
    #     G.edges[src, tgt]["trussness"] = 2
    # # 2.k从2->max，执行k_truss，将子图的所有边的trussness更新
    # k = 2
    # while True:
    #     k += 1
    #     subGraph = nx.k_truss(G, k)
    #     if nx.is_empty(subGraph):
    #         break
    #     for edge in list(subGraph.edges):
    #         src = edge[0]
    #         tgt = edge[1]
    #         G.edges[src, tgt]["trussness"] = k
    # global maxTrussness
    # maxTrussness = k - 1

def nodes_reordering(cluster):
    cluster = [int(node) for node in cluster]
    cohesive_subgraph = G.subgraph(cluster)
    X = nx.to_numpy_matrix(cohesive_subgraph)
    if len(X) < 2:
        return [str(i) for i in list(cluster)]
    Z = hierarchy.ward(X)
    result = hierarchy.leaves_list(hierarchy.optimal_leaf_ordering(Z, X))
    return [str(cluster[i]) for i in list(result)]


def read_graph(graph_name):
    #将图数据读入
    _G = nx.read_edgelist(base_dir+"/graph_data/"+graph_name+".txt", nodetype=int)
    G = nx.Graph()
    G.add_nodes_from(sorted(_G.nodes(data=True)))
    G.add_edges_from(_G.edges(data=True))
    #有向图转无向图
    G = G.to_undirected()
    #删除自环
    G.remove_edges_from(nx.selfloop_edges(G))
    return G

def layout(graph, pos):
    nodes_list = list(graph.nodes)
    for node in nodes_list:
        graph.nodes[node]["x"] = pos[node][0]
        graph.nodes[node]["y"] = pos[node][1]

def largest_cc(graph):
    # 获取最大连通子图
    set_largest_cc = max(nx.connected_components(graph), key=len)
    return graph.subgraph(list(set_largest_cc))

def test(graph):
    # 获取最大连通子图
    graph = largest_cc(graph)
    for i, node in enumerate(list(graph.nodes)):
        graph.nodes[node]["index"] = i
    print("node")
    for edge in list(graph.edges):
        [src, tgt] = edge
        srcNeighbors = set(graph.neighbors(src))
        tgtNeighbors = set(graph.neighbors(tgt))
        triCount = len(srcNeighbors & tgtNeighbors)
        graph.edges[src, tgt]['triCount'] = 2/(1+pow(math.e, -triCount))
        # graph.edges[src, tgt]['triCount'] = 1 / (1+triCount)
    print("edge")
    # pos = stress_majorization(graph)
    # layout(graph, pos)
    # print("stress layout")

    pos = nx.spring_layout(graph,
                           # pos=pos,
                           weight="triCount",
                           # iterations=50
                           )
    print("fdp layout")

    # print(pos)
    nx.draw(graph, pos=pos, node_size=10, with_labels=False)
    plt.show()

if __name__ == '__main__':
    get_graph('Caltech36')
    # get_graph(default["graph_name"])
    # get_graph(default["graph_name"])
    # set_egonetwork(default["graph_name"], 0)
    # reconstruct_graph(read_graph(default["graph_name"]));
    # get_clustering_coefficient(default["graph_name"])
    # compute_clustering_coefficient(read_graph(default["graph_name"]))
    # clear_graph(read_graph(default["graph_name"]))
    # test(read_graph('email-Eu-core'))
    test(read_graph('miserables'))
    # test(read_graph('test'))
