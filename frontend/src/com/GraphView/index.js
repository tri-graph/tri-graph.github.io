import { render } from "@testing-library/react";
import React from "react";
import Graph from "../nodeLink/graph";
import * as d3 from "d3";
import { observer, inject } from "mobx-react";

@inject("mainStore")
@observer
export default class GraphView extends React.Component {
  constructor(props) {
    super(props);
  }
  handleSearch = (value) => {
    this.props.mainStore.setEgoGraphData(value);
  };
  color = ['rgb(55,126,184)','rgb(166,86,40)','rgb(228,26,28)','rgb(77,175,74)','rgb(152,78,163)','rgb(255,127,0)','rgb(247,129,191)','rgb(224,130,20)','rgb(153,153,153)', 'rgb(217,217,217)']
  componentDidMount() {
    // d3.selectAll("svg").remove();
    let egoLabel = d3
      .select("#graphViewWrapper")
      .append("svg")
      .attr("width", 155)
      .attr("height", 290)
      .attr("class", "egoLabel")
      .attr("transform", "translate(0, -285)");

    //add encompassing group for the zoom
    let eg = egoLabel.append("g").attr("class", "egEverything");
    // let boundary = eg
    //   .append("rect")
    //   .attr("x", 0)
    //   .attr("y", 0)
    //   .attr("height", 290)
    //   .attr("width", 130)
    //   .attr("fill", "#ffffff98")
    //   .attr("stroke", "#f2f2f2")
    //   .attr("stroke-width", 3);

    let highLightLinkLabelText1 = eg
      .append("text")
      .attr("x", 28)
      .attr("y", 273)
      .text("Highlighted triangle");
    // let TriangleLinkLabel = eg
    //   .append("line")
    //   .attr("x1", 15)
    //   .attr("y1", 260)
    //   .attr("x2", 9)
    //   .attr("y2", 274)
    //   .attr("stroke", "#a77e3f")
    //   .attr("stroke-width", 3);
    let triLinkLabel = eg
      .append("path")
      .attr("d", `m${8.5} ${274} L${15} ${260} L${21.5} ${274} Z`)
      .attr("fill", "none")
      .attr("stroke", "#fb9a99")
      .attr("stroke-width", "2");
    let highLightLinkLabel = eg
      .append("line")
      .attr("x1", 7.3)
      .attr("y1", 274)
      .attr("x2", 22.7)
      .attr("y2", 274)
      .attr("stroke", "#3186c7")
      .attr("stroke-width", 3);
    // let TriangleLinkLabelText1 = eg
    //   .append("text")
    //   .attr("x", 28)
    //   .attr("y", 295)
    //   .text("triangle links");
    // let highLightLinkLabelText2 = eg
    //   .append("text")
    //   .attr("x", 90)
    //   .attr("y", 273)
    //   .text("link");
    this.color.forEach((color, i) => {
      eg.append("circle")
        .attr("cx", 15)
        .attr("cy", (i + 1) * 25 - 5)
        .attr("r", 6)
        .attr("fill", color);
      eg.append("text")
        .attr("x", 28)
        .attr("y", (i + 1) * 25 + 5 - 5)
        .text(i !== 9 ? `Cluster ${i}` : "Other clusters");
    });
  }

  render() {
    
    let cluster_id = this.props.mainStore.cluster_id;
    d3.select(".clusterLabel").remove();
    if (cluster_id !== -1) {
      let clusterLabel = d3
        .select("#graphViewWrapper")
        .append("svg")
        .attr("width", 100)
        .attr("height", 40)
        .attr("class", "clusterLabel")
        .attr("transform", "translate(-140, -1270)");
      let boundary = clusterLabel
        .append("rect")
        .attr("x", 3)
        .attr("y", 5)
        .attr("height", 25)
        .attr("width", 71)
        .attr("fill", "#ffffff98")
        .attr("stroke", this.color[cluster_id >= 9 ? 9 : cluster_id])
        .attr("stroke-width", 2)
        .attr("class", "clusterRect");
      if (cluster_id > 9 && cluster_id < 100) {
        d3.select(".clusterRect").attr("width", 79);
      } else if (cluster_id > 99) {
        d3.select(".clusterRect").attr("width", 87);
      }
      let labelText = clusterLabel
        .append("text")
        .attr("x", 10)
        .attr("y", 22)
        .text(`Cluster ${cluster_id}`)
        .style("fill", this.color[cluster_id >= 9 ? 9 : cluster_id])
        .style("font-weight", "bold");
    }
    return (
      <div>
        <div className={"view-class-title"} id={"graphViewTitle"}>
          Graph View
        </div>
        <div>
          <Graph width={955} height={980}></Graph>
        </div>
      </div>
    );
  }
}
