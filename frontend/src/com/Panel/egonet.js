import React from "react";
import "./index.css";
import EgoGraph from "../nodeLink/egoGraph";
import { Divider } from "antd";
import { Input, Space } from "antd";
import { observer, inject } from "mobx-react";
import { AudioOutlined } from "@ant-design/icons";
import { nodeStyle, linkStyle } from "../../style/nodeLinkStyle";
import * as d3 from "d3";

const { Search } = Input;

@inject("mainStore")
@observer
export default class Egonet extends React.Component {
  constructor(props) {
    super(props);
  }
  handleSearch = (value) => {
    this.props.mainStore.setEgoGraphData(value);
  };
  componentDidMount() {
    // d3.selectAll("svg").remove();
    let egoLabel = d3
      .select("#ego_network")
      .append("svg")
      .attr("width", 150)
      .attr("height", 80)
      .attr("class", "egoLabel")
      .attr("transform", "translate(0, -70)");

    //add encompassing group for the zoom
    let eg = egoLabel.append("g").attr("class", "egEverything");
    // let boundary = eg
    //   .append("rect")
    //   .attr("x", 0)
    //   .attr("y", 0)
    //   .attr("height", 80)
    //   .attr("width", 150)
    //   .attr("fill", "#ffffff98")
    //   .attr("stroke", "#f2f2f2")
    //   .attr("stroke-width", 3);
    let centerCircle = eg
      .append("circle")
      .attr("cx", 15)
      .attr("cy", 25)
      .attr("r", 6)
      .attr("stroke", "#020202")
      .attr("stroke-width", nodeStyle.egoStrokeWidth)
      .attr("fill", "#D9D9D9");
    let centerCircleText = eg
      .append("text")
      .attr("x", 28)
      .attr("y", 30)
      .text("Ego node");
    let neighbourCircle = eg
      .append("circle")
      .attr("cx", 15)
      .attr("cy", 50)
      .attr("r", 6)
      .attr("fill", "#D9D9D9");
    let centetCircleText = eg
      .append("text")
      .attr("x", 28)
      .attr("y", 55)
      .text("Neighbour node");
  }
  render() {
    // const color = [
    //   "#8DD3C7",
    //   "#eaa693",
    //   "#BEBADA",
    //   "#FB8072",
    //   "#80B1D3",
    //   "#FDB462",
    //   "#B3DE69",
    //   "#FCCDE5",
    //   "#8B8B7A",
    //   "#D9D9D9",
    // ];
    d3.select(".egoNodeLabel").remove();
    let ego_id = this.props.mainStore.ego_id;
    if (ego_id !== -1) {
      let nodeLabel = d3
        .select("#ego_network")
        .append("svg")
        .attr("width", 100)
        .attr("height", 40)
        .attr("class", "egoNodeLabel")
        .attr("transform", "translate(-138, -542)");
      let labelText = nodeLabel
        .append("text")
        .attr("x", 10)
        .attr("y", 23.5)
        .text(`Node ${ego_id}`)
        .style("fill", "#000")
        .style("font-weight", "bold");
    }
    return (
      <div className={"ego_network"} id={"ego_network"}>
        {/* <Divider>ego-network</Divider> */}
        <div className={"view-class-title"}>Ego-network</div>
        <div className={"inputWrapper"}>
          <span className={"nodeIdText"}>Node ID:&nbsp;&nbsp;</span>
          <Search
            placeholder="Search or click nodes in Graph View"
            onSearch={this.handleSearch.bind(this)}
            style={{ width: 350, fontSize: "16px" }}
          />
        </div>

        <div className={"egoWrapper"}>
          <EgoGraph width={480} height={385}></EgoGraph>
        </div>
      </div>
    );
  }
}
