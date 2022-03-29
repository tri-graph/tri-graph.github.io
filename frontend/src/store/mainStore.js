import { max } from "d3-array";
import { observable, action, toJS, isArrayLike } from "mobx";
import { observer } from "mobx-react-lite";
import { fetchGraph, fetchEgoGraph, fetchKGraph } from "../com/fireAjax";

class MainStore {
  @observable graph_name = "";
  @observable kData = {};
  @observable cluster_id = -1;
  @observable selectedRowKeys = [-1];
  @observable currentData = {
    nodes: [],
    links: [],
    maxTrussness: 0,
    clusterArray: [],
  };
  @observable clusterData = [];
  @observable graphData = {
    nodes: [],
    links: [],
    maxTrussness: 0,
    clusterArray: [],
  };
  @action setSelectedRowKeys(arr) {
    this.selectedRowKeys = arr;
  }
  @action set_cluster_id(id) {
    this.cluster_id = id;
  }
  @action setClusterData(clusterData) {
    this.clusterData = clusterData;
  }
  @action set_graph_name(name) {
    this.graph_name = name;
  }
  @action set_kData(kdata) {
    this.kData = kdata;
  }
  @action setCurrentData(cluster_id = -1) {
    if (cluster_id < 0) {
      this.currentData = JSON.parse(JSON.stringify(this.graphData));
      this.set_cluster_id(cluster_id);
      // this.currentData = this.clusterData[1];
    } else {
      this.set_cluster_id(cluster_id);
      this.currentData = JSON.parse(
        JSON.stringify(this.clusterData[cluster_id])
      );
    }
    this.set_trussnessArray([2, this.currentData.maxTrussness]);
  }

  @action async setGraphData(graph_name = undefined) {
    this.set_graph_name(graph_name);
    // this.setNodesOrdering(-1);
    let result = null;
    if (graph_name === undefined) {
      result = await fetchGraph({});
    } else {
      result = await fetchGraph({ graph_name: graph_name });
    }
    const clusterMap = result.clusterMap;
    const orderingNodes = [...clusterMap[-1]].map((node) => ({ id: node }));
    const nodes = [...result.graphData.nodes];
    const links = [...result.graphData.links];
    const maxTrussness = result.maxTrussness;
    const clusterArray = [...result.clusterArray].slice(1);
    const cluster2Index = {};
    clusterArray.forEach((cluster, index) => {
      cluster2Index[+cluster.cluster_id] = index;
      cluster.linksSize = 0;
    });
    const k_add_edges = [];
    for (let i in result.k_add_edges) {
      let o = {};
      o["k"] = +i;
      o["edges"] = result.k_add_edges[i];
      k_add_edges.push(o);
    }
    const default_k = result.default_k;
    this.set_kData({ k_add_edges: k_add_edges, default_k: default_k });
    //按聚类切分初始数据得到clusterArray

    const length = clusterArray.length;
    let clusterData = [];
    for (let i = 0; i < length; i++) {
      clusterData.push({
        nodes: [],
        links: [],
        orderingNodes: [],
        maxTrussness: 2,
        cluster2Index,
      });
    }
    for (let i = 0; i < length; i++) {
      clusterData[i].orderingNodes = clusterMap[i].map((node) => ({
        id: node,
      }));
    }
    nodes.forEach((node) => {
      clusterData[+node.attributes.cluster].nodes.push(node);
    });
    links.forEach((link) => {
      if (link.source_cluster === link.target_cluster) {
        clusterData[link.source_cluster].links.push(link);
        clusterData[link.source_cluster].maxTrussness = Math.max(
          clusterData[link.source_cluster].maxTrussness,
          link.attributes.trussness
        );
        clusterArray[link.source_cluster].linksSize++;
      }
    });
    const cluster2MaxTrussness = [];
    clusterData.forEach((cluster, index) => {
      cluster2MaxTrussness[index] = cluster.maxTrussness;
    });
    this.graphData = {
      nodes,
      links,
      maxTrussness,
      clusterArray,
      clusterMap,
      cluster2Index,
      cluster2MaxTrussness,
      orderingNodes,
    };
    this.setCurrentData(-1);
    this.setSelectedRowKeys([-1]);
    this.setClusterData(clusterData);
  }
  @action async getKData(k = -1) {
    // this.set_graph_name(graph_name);
    // this.setNodesOrdering(-1);
    let result = null;
    if (k === -1) {
      result = await fetchKGraph({});
    } else {
      result = await fetchKGraph({ k: k, graph_name: this.graph_name });
    }
    const clusterMap = result.clusterMap;
    const orderingNodes = [...clusterMap[-1]].map((node) => ({ id: node }));
    const nodes = [...result.graphData.nodes];
    const links = [...result.graphData.links];
    const maxTrussness = result.maxTrussness;
    const clusterArray = [...result.clusterArray].slice(1);
    const cluster2Index = {};
    clusterArray.forEach((cluster, index) => {
      cluster2Index[+cluster.cluster_id] = index;
      cluster.linksSize = 0;
    });
    const k_add_edges = [];
    for (let i in result.k_add_edges) {
      let o = {};
      o["k"] = +i;
      o["edges"] = result.k_add_edges[i];
      k_add_edges.push(o);
    }
    const default_k = result.default_k;
    this.set_kData({ k_add_edges: k_add_edges, default_k: default_k });

    // this.graphData.nodes = nodes;
    // this.graphData.links = links;
    // this.graphData.maxTrussness = maxTrussness;
    // this.graphData.clusterArray = clusterArray;
    // this.graphData.clusterMap = clusterMap;
    // this.graphData.cluster2Index = cluster2Index;
    // this.graphData.cluster2MaxTrussness = cluster2MaxTrussness;
    // this.graphData.orderingNodes = orderingNodes;

    //按聚类切分初始数据得到clusterArray

    const length = clusterArray.length;
    let clusterData = [];
    for (let i = 0; i < length; i++) {
      clusterData.push({
        nodes: [],
        links: [],
        orderingNodes: [],
        maxTrussness: 2,
        cluster2Index,
      });
    }
    for (let i = 0; i < length; i++) {
      clusterData[i].orderingNodes = clusterMap[i].map((node) => ({
        id: node,
      }));
    }
    nodes.forEach((node) => {
      clusterData[+node.attributes.cluster].nodes.push(node);
    });
    links.forEach((link) => {
      if (link.source_cluster === link.target_cluster) {
        clusterData[link.source_cluster].links.push(link);
        clusterData[link.source_cluster].maxTrussness = Math.max(
          clusterData[link.source_cluster].maxTrussness,
          link.attributes.trussness
        );
        clusterArray[link.source_cluster].linksSize++;
      }
    });
    const cluster2MaxTrussness = [];
    clusterData.forEach((cluster, index) => {
      cluster2MaxTrussness[index] = cluster.maxTrussness;
    });
    this.graphData = {
      nodes,
      links,
      maxTrussness,
      clusterArray,
      clusterMap,
      cluster2Index,
      cluster2MaxTrussness,
      orderingNodes,
    };
    this.setCurrentData(-1);
    this.setSelectedRowKeys([-1]);
    this.setClusterData(clusterData);
  }

  @observable ego_id = -1;
  @action set_ego_id = (id) => {
    this.ego_id = id;
  };
  @observable egoGraphData = {
    nodes: [],
    links: [],
  };

  @action setEgoGraphData = async (node_id = undefined) => {
    this.set_ego_id(node_id);
    let egoResult = null;
    if (node_id === undefined) {
      egoResult = await fetchEgoGraph({});
    } else {
      egoResult = await fetchEgoGraph({
        node_id: node_id,
        graph_name: this.graph_name,
      });
    }
    const nodes = [...egoResult.nodes];
    const links = [...egoResult.links];
    this.egoGraphData = {
      nodes,
      links,
    };
  };

  @observable highLightLink = [];
  @action set_highLightLink = (link) => {
    this.highLightLink = link;
  };

  @observable trussnessArray = [2, 999999999999];
  @action set_trussnessArray = (arr) => {
    this.trussnessArray = arr;
  };
}
export default MainStore;
