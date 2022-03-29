import React, { Component } from "react";
import "./index.css";
import * as d3 from "d3";
import { observer, inject } from "mobx-react";
import { toJS } from "mobx";
// import links from "./email-Eu-core-temporal-Dept2.json";

@inject("mainStore")
@observer
export default class EdgeView extends Component {
  // componentDidMount() {
  //   const graphData = toJS(this.props.mainStore.graphData);
  //   this.drawGrids();
  // }
  deepCopy(obj) {
    let a = JSON.stringify(obj);
    let newobj = JSON.parse(a);
    return newobj;
  }

  drawGrids() {
    const currentData = toJS(this.props.mainStore.currentData);
    const links = currentData.links;
    let clusterid = this.props.mainStore.cluster_id;
    if (clusterid === -1) {
      d3.selectAll(".gridsvg").remove();
      d3.select(".edgeViewClusterLabel").remove();
    } else if (links.length !== 0) {
      const graphData = this.deepCopy(this.props.mainStore.currentData);

      // let highLightLink = this.props.mainStore.highLightLink;
      const set_highLightLink = this.props.mainStore.set_highLightLink;
      const trussColor = d3.interpolateSpectral;

      const maxTrussness = graphData.maxTrussness;

      let graphSize = 0;

      var graphMap = {};

      var nodeids = [];

      let coordinateArray = [1];

      let filterMatrix = [];

      let linkID2nodeID = {};

      let selectedCircle = "";

      const cellColor = {
        leftTop: "#fbb4ae",
        leftBottom: "#ccebc5",
        rightBottom: "#b3cde3",
      };

      const linkColor = {
        leftTop: "#fbb4aeB3",
        leftBottom: "#ccebc5B3",
        rightBottom: "#b3cde3B3",
      };

      function getMatrixData(graph) {
        var data = new Array();
        var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
        var ypos = 1;
        var width = cellSize;
        var height = cellSize;

        // iterate for rows
        for (var row = 0; row < graphSize; row++) {
          data.push(new Array());

          // iterate for cells/columns inside rows
          for (var column = 0; column < graphSize; column++) {
            const id = "_" + row + "_" + column;
            data[row].push({
              row: row,
              col: column,
              x: xpos,
              y: ypos,
              width: width,
              height: height,
              id: id,
              trussness:
                row < column && graphMap.link.hasOwnProperty(id)
                  ? graphMap.link[id].trussness
                  : -1,
              triangleLinks:
                row < column && graphMap.link.hasOwnProperty(id)
                  ? graphMap.link[id].triangleLinks
                  : [],
              triangles:
                row < column && graphMap.link.hasOwnProperty(id)
                  ? graphMap.link[id].triangles
                  : [],
            });
            // increment the x position. I.e. move it over by 50 (width variable)
            xpos += width;
          }
          // reset the x position after a row is complete
          xpos = 1;
          // increment the y position for the next row. Move it down 50 (height variable)
          ypos += height;
        }
        return data;
      }

      function setGraphMap(graph) {
        let nodeid2Idx = {};
        let linkMap = {};
        graphMap = { node: nodeid2Idx, link: linkMap };
        graph.nodes.forEach((node, i) => {
          nodeid2Idx[node.id] = i;
          nodeids.push(node.id);
        });
        graph.links.forEach((link) => {
          let src = nodeid2Idx[link.source];
          let tgt = nodeid2Idx[link.target];
          if (src < tgt) {
            linkMap["_" + src + "_" + tgt] = link;
          } else {
            linkMap["_" + tgt + "_" + src] = link;
          }
        });
      }

      function setTrussness(g) {
        let neighbours = new Map();
        g.nodes.forEach((node) => {
          neighbours[node.id] = new Set();
        });
        g.links.forEach((link) => {
          let s = link.source,
            t = link.target;
          neighbours[s].add(t);
          neighbours[t].add(s); //默认为无向图
        });
        let length = g.links.length;
        //setTriangles
        for (let i = 0; i < length; i++) {
          let link = g.links[i];
          let s = link.source,
            t = link.target;
          let triangleNodes = intersect(neighbours[s], neighbours[t]);
          let src = graphMap.node[link.source];
          let tgt = graphMap.node[link.target];
          if (src < tgt) {
            link["id"] = "_" + src + "_" + tgt;
          } else {
            link["id"] = "_" + tgt + "_" + src;
          }
          linkID2nodeID[link["id"]] = [s, t];
          const triangleLinks = [];
          const triangles = [];
          triangleNodes.forEach((triangleNode) => {
            let tri = graphMap.node[triangleNode];
            let srcLink = null;
            let tgtLink = null;
            if (src < tri) {
              srcLink = "_" + src + "_" + tri;
            } else {
              srcLink = "_" + tri + "_" + src;
            }
            if (tgt < tri) {
              tgtLink = "_" + tgt + "_" + tri;
            } else {
              tgtLink = "_" + tri + "_" + tgt;
            }
            triangleLinks.push(srcLink);
            triangleLinks.push(tgtLink);
            triangles.push([srcLink, tgtLink, link["id"]]);
          });
          link.triangleLinks = triangleLinks;
          link.triangles = triangles;
          link["trussness"] = link.attributes.trussness;
        }
        // let k = 2;
        // let allRemoveLinks = 0;
        // while (allRemoveLinks < length) {
        //   k += 1;
        //   let removeLinks = 1; //初始化为任意大于0的值即可
        //   while (removeLinks > 0) {
        //     removeLinks = 0;
        //     for (let i = 0; i < length; i++) {
        //       let link = g.links[i];
        //       let s = link.source,
        //         t = link.target;
        //       let trussness = intersect(neighbours[s], neighbours[t]).size;
        //       if (trussness < k - 2 && !link.hasOwnProperty("trussness")) {
        //         //这里判断边是否存在只能用link.hasOwnProperty("trussness")而不能用neighbours[s].has(t)，因为有的图数据是有向图，两点之间可能已经存在逆向的边且被删除过。
        //         link["trussness"] = k - 1;
        //         neighbours[s].delete(t);
        //         neighbours[t].delete(s);
        //         removeLinks += 1;
        //       }
        //     }
        //     allRemoveLinks += removeLinks;
        //   }
        // }

        // maxTrussness = k - 1;
        g.links.sort((a, b) => {
          return a["trussness"] - b["trussness"];
        });
      }

      // function getNodesFromLinks(links) {
      //   let nodes = new Set();
      //   links.forEach((link) => {
      //     nodes.add(link.source);
      //     nodes.add(link.target);
      //   });
      //   return [...nodes].map((node) => ({ id: node }));
      // }

      function intersect(a, b) {
        return new Set([...a].filter((x) => b.has(x)));
      }

      function union(a, b) {
        return new Set([...a, ...b]);
      }

      function getGradientColors(startColor, endColor, step, exp) {
        let gradientColorScale = d3
          .scalePow()
          .exponent(exp)
          .domain([1, maxTrussness])
          .range([1, maxTrussness]);
        let startRGB = startColor;
        let startR = startRGB[0];
        let startG = startRGB[1];
        let startB = startRGB[2];
        let endRGB = endColor;
        let endR = endRGB[0];
        let endG = endRGB[1];
        let endB = endRGB[2];
        let sR = (endR - startR) / step; //总差值
        let sG = (endG - startG) / step;
        let sB = (endB - startB) / step;
        var colorArr = [];
        for (let i = 0; i < step; i++) {
          let j = gradientColorScale(i + 1);
          //计算每一步的rgb值
          var color =
            "rgba(" +
            parseInt(sR * j + startR) +
            ", " +
            parseInt(sG * j + startG) +
            ", " +
            parseInt(sB * j + startB) +
            ", 0.5)";
          colorArr.push(color);
        }
        return colorArr;
      }

      const getCoordinateArray = (graphSize) => {
        let sum = 1;
        for (let i = 0; i < graphSize; i++) {
          sum += cellSize;
          coordinateArray.push(sum);
        }
      };

      if (graph === undefined) {
        var graph = {};
        graph["links"] = graphData.links;
        // graph["nodes"] = getNodesFromLinks(graphData.links);
        graph["nodes"] = graphData.orderingNodes;
      }
      setGraphMap(graph);
      setTrussness(graph);

      graphSize = graph.nodes.length;

      let cellSize = Math.min(460 / graphSize, 35);
      let coordinateLineSize = cellSize * 0.25;
      let diagonalLineSize = cellSize * 0.1;
      let circleR = cellSize * 0.375;
      let triLinkSize = cellSize > 15 ? cellSize * 0.15 : cellSize * 0.35;
      let diagonalLineLength = cellSize * 0.4;

      getCoordinateArray(graphSize);

      let gradientColors = getGradientColors(
        [255, 255, 255],
        [2, 2, 2],
        maxTrussness + 2,
        1
      );

      let matrix = getMatrixData(graph);

      for (let i = 0; i < graphSize; i++) {
        let arr = matrix[i];
        filterMatrix.push(arr.filter((d) => d.trussness > 0));
      }

      d3.selectAll(".gridsvg").remove();

      let svg = d3
        .select("#grid")
        .append("svg")
        .attr("width", 511)
        .attr("height", 471)
        .attr("class", "gridsvg");
      // .attr("transform", `translateX(100)`);
      //add encompassing group for the zoom
      var g = svg.append("g").attr("class", "everything");

      // if (cellSize * graphSize < 490) {
      //   g.attr(
      //     "transform",
      //     `translate(${(490 - cellSize * graphSize) * 0.5}, ${
      //       (528 - cellSize * graphSize) * 0.5
      //     })`
      //   );
      // }
      g.attr(
        "transform",
        `translate(${(510 - cellSize * graphSize) * 0.5}, ${
          (460 - cellSize * graphSize) * 0.5
        })`
      );
      let row = g
        .selectAll(".row")
        .data(filterMatrix)
        .enter()
        .append("g")
        .attr("class", "row");

      let rowLines = g
        .selectAll(".rowLine")
        .data(coordinateArray)
        .enter()
        .append("line")
        .attr("class", "line")
        .attr("x1", 1 - coordinateLineSize * 0.5)
        .attr("y1", (d) => d)
        .attr("x2", 1 + graphSize * cellSize + coordinateLineSize * 0.5)
        .attr("y2", (d) => d)
        .attr("stroke", "#f2f2f2")
        .attr("stroke-width", coordinateLineSize);

      let colLines = g
        .selectAll(".colLine")
        .data(coordinateArray)
        .enter()
        .append("line")
        .attr("class", "line")
        .attr("x1", (d) => d)
        .attr("y1", 1)
        .attr("x2", (d) => d)
        .attr("y2", 1 + graphSize * cellSize)
        .attr("stroke", "#f2f2f2")
        .attr("stroke-width", coordinateLineSize);

      let diagonalLine = g
        .append("line")
        .attr("x1", 1)
        .attr("y1", 1)
        .attr("x2", 1 + graphSize * cellSize)
        .attr("y2", 1 + graphSize * cellSize)
        .style("stroke-dasharray", diagonalLineLength)
        .style("stroke-width", diagonalLineSize)
        .style("stroke", "#f2f2f2");
      let symmetryCircle = row
        .selectAll(".square")
        .data(function (d) {
          return d;
        })
        .enter()
        .append("circle")
        .attr("class", "symmetryCircle")
        .attr("cx", function (d) {
          return d.y + d.width / 2;
        })
        .attr("cy", function (d) {
          return d.x + d.width / 2;
        })
        .attr("r", circleR)
        .style("fill", function (d) {
          let trussness = d["trussness"];
          return gradientColors[trussness];
        })
        .style("cursor", "no-drop")
        .style("cursor", "not-allowed");
      let column = row
        .selectAll(".square")
        .data(function (d) {
          return d;
        })
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("id", function (d) {
          return d.id;
        })
        .attr("cx", function (d) {
          return d.x + d.width / 2;
        })
        .attr("cy", function (d) {
          return d.y + d.width / 2;
        })
        .attr("r", circleR)
        .style("fill", function (d) {
          let trussness = d["trussness"];
          return gradientColors[trussness];
        })
        .style("cursor", "pointer")
        .on("click", function (d) {
          selectedCircle = this.id;
          let ids = this.id.split("_");
          let row = +ids[1];
          let col = +ids[2];
          set_highLightLink(
            [d.id, ...d.triangleLinks].map((linkID) => {
              return linkID2nodeID[linkID];
            })
          );
        })
        .on("mouseover", function (d) {
          let center = this.id.split("_");
          let center_row = +center[1];
          let center_col = +center[2];

          d.triangleLinks.forEach((link) => {
            let cell = link.split("_");
            let cell_row = +cell[1];
            let cell_col = +cell[2];
            let color = null;
            if (cell_row < center_row && cell_col <= center_col) {
              color = cellColor.leftTop;
            } else if (cell_row >= center_row && cell_col <= center_col) {
              color = cellColor.leftBottom;
            } else if (cell_row >= center_row && cell_col > center_col) {
              color = cellColor.rightBottom;
            }
            d3.select("#" + link).style("fill", color);
          });

          [
            [0, 1],
            [1, 2],
            [0, 2],
          ].forEach((ix) => {
            let l0 = ix[0],
              l1 = ix[1];
            let links = g
              .append("g")
              .attr("class", "triLinks")
              .selectAll("line")
              .data(d.triangles)
              .enter()
              .append("line")
              .attr("stroke-width", triLinkSize)
              .attr("stroke", function (d) {
                let cell = d[0].split("_");
                let cell_row = +cell[1];
                let cell_col = +cell[2];
                let color = null;
                if (cell_row < center_row && cell_col <= center_col) {
                  color = linkColor.leftTop;
                } else if (cell_row >= center_row && cell_col <= center_col) {
                  color = linkColor.leftBottom;
                } else if (cell_row >= center_row && cell_col > center_col) {
                  color = linkColor.rightBottom;
                }
                return color;
              })
              .attr("x1", function (d) {
                return (
                  matrix[d[l0].split("_")[1]][d[l0].split("_")[2]].x +
                  (1 / 2) * cellSize
                );
              })
              .attr("y1", function (d) {
                return (
                  matrix[d[l0].split("_")[1]][d[l0].split("_")[2]].y +
                  (1 / 2) * cellSize
                );
              })
              .attr("x2", function (d) {
                return (
                  matrix[d[l1].split("_")[1]][d[l1].split("_")[2]].x +
                  (1 / 2) * cellSize
                );
              })
              .attr("y2", function (d) {
                return (
                  matrix[d[l1].split("_")[1]][d[l1].split("_")[2]].y +
                  (1 / 2) * cellSize
                );
              })
              .attr("pointer-events", "none");
          });
        })
        .on("mouseout", function (d) {
          if (this.id === selectedCircle) {
            set_highLightLink([]);
            selectedCircle = "";
          }
          d.triangleLinks.forEach((link) => {
            d3.select("#" + link).style("fill", function () {
              let trussness = graphMap.link[this.id].trussness;
              return gradientColors[trussness];
            });
          });

          d3.selectAll(".triLinks").remove();
        });

      //add zoom capabilities
      var zoom_handler = d3.zoom().on("zoom", function () {
        g.attr("transform", d3.event.transform);
      });

      zoom_handler(svg);
      // let label = d3
      //   .select("#grid")
      //   .append("svg")
      //   .attr("width", 150)
      //   .attr("height", 200)
      //   .attr("class", "gridsvg")
      //   .attr("transform", `translate(100, -300)`);

      //add encompassing group for the zoom
      let lg = svg.append("g").attr("class", "labelEverything").attr("transform", `translate(-22, 348)`);
      let boundary = lg
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("rx", 18)
        .attr("ry", 18)
        .attr("width", 100)
        .attr("height", 125)
        .attr("transform", `translate(5, 15)`)
        .attr("fill", "#fff")
        .attr("stroke", "#f2f2f2")
        .attr("stroke-width", 3);
      let diagonalLineLabel = lg
        .append("line")
        .attr("x1", 20)
        .attr("y1", 50)
        .attr("x2", 105)
        .attr("y2", 125)
        .style("stroke-dasharray", 6)
        .attr("stroke", "#f2f2f2")
        .attr("stroke-width", 3);
      let boundLineLabel = lg
        .append("line")
        .attr("x1", 20)
        .attr("y1", 50)
        .attr("x2", 105)
        .attr("y2", 50)
        .attr("stroke", "#f2f2f2")
        .attr("stroke-width", 3);
      let bluetri = lg
        .append("path")
        .attr("d", `m${75} ${75} L${90} ${75} L${90} ${110} Z`)
        .attr("fill", "none")
        .attr("stroke", cellColor.rightBottom)
        .attr("stroke-width", "3");
      let greentri = lg
        .append("path")
        .attr("d", `m${75} ${75} L${60} ${75} L${75} ${90} Z`)
        .attr("fill", "none")
        .attr("stroke", cellColor.leftBottom)
        .attr("stroke-width", "3");
      let redtri = lg
        .append("path")
        .attr("d", `m${75} ${75} L${75} ${55} L${40} ${55} Z`)
        .attr("fill", "none")
        .attr("stroke", cellColor.leftTop)
        .attr("stroke-width", "3");
      let labelCenter = lg
        .append("circle")
        .attr("cx", 75)
        .attr("cy", 75)
        .attr("r", 4)
        .attr("fill", "#a6a6a6");
      let trussnessLabelText = lg
        .append("text")
        .text("Trussness")
        .attr("x", 30)
        .attr("y", 46);
      let minT = lg.append("text").text("2").attr("x", 22).attr("y", 32);
      let maxT = lg
        .append("text")
        .text(graphData.maxTrussness)
        .attr("x", 83)
        .attr("y", 32);
      let defs = lg.append("defs");
      let linearGradient = defs
        .append("linearGradient")
        .attr("id", "linearColor")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
      let stop1 = linearGradient
        .append("stop")
        .attr("offset", "0%")
        .style("stop-color", gradientColors[2]);
      let stop2 = linearGradient
        .append("stop")
        .attr("offset", "100%")
        .style("stop-color", gradientColors[graphData.maxTrussness]);
      let colorRect = lg
        .append("rect")
        .attr("x", 32)
        .attr("y", 21)
        .attr("rx", 6)
        .attr("ry", 21)
        .attr("width", 49)
        .attr("height", 12)
        .style("fill", `url(#linearColor)`);
      

      const color = [
        "#8DD3C7",
        "#eaa693",
        "#BEBADA",
        "#FB8072",
        "#80B1D3",
        "#FDB462",
        "#B3DE69",
        "#FCCDE5",
        "#8B8B7A",
        "#D9D9D9",
      ];
      let cluster_id = this.props.mainStore.cluster_id;
      d3.select(".edgeViewClusterLabel").remove();
      if (cluster_id !== -1) {
        let edgeViewClusterLabel = d3
          .select("#edgeTitle")
          .append("svg")
          .attr("width", 90)
          .attr("height", 40)
          .attr("class", "edgeViewClusterLabel")
          .attr("transform", "translate(15, -2)")
          .style("float", "left");
        let boundary = edgeViewClusterLabel
          .append("rect")
          .attr("x", 3)
          .attr("y", 5)
          .attr("height", 25)
          .attr("width", 71)
          .attr("fill", "#ffffff98")
          .attr("stroke", color[cluster_id >= 9 ? 9 : cluster_id])
          .attr("stroke-width", 2)
          .attr("class", "clusterRect");
        if (cluster_id > 9 && cluster_id < 100) {
          d3.select(".clusterRect").attr("width", 79);
        } else if (cluster_id > 99) {
          d3.select(".clusterRect").attr("width", 87);
        }
        let labelText = edgeViewClusterLabel
          .append("text")
          .attr("x", 10)
          .attr("y", 22)
          .text(`Cluster ${cluster_id}`)
          .style("fill", color[cluster_id >= 9 ? 9 : cluster_id])
          .style("font-weight", "bold")
          .style("font-size", "14px");
      }
    }
  }

  // componentDidMount() {
  //   this.drawGrids();
  // }

  render() {
    this.drawGrids();
    console.log("render edgeview");
    return (
      <div id={"edgeCluster"}>
        <div className={"view-class-title"} id={"edgeTitle"}><div id = "title">Edge View</div></div>
        <div id={"grid"}></div>
      </div>
    );
  }
}
