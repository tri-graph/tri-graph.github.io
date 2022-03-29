import React from "react";
import "./index.css";
import { Slider } from "antd";
import * as d3 from "d3";
import { observer, inject } from "mobx-react";

@inject("mainStore")
@observer
export default class Ktrus extends React.Component {
  constructor(props) {
    super(props);
  }
  setTrussness(value) {
    this.props.mainStore.set_trussnessArray(value);
  }
  drawText(){
    d3.select(".maxTrussnessText").remove();
    let text = d3
        .select(".sliderWrapper")
        .append("svg")
        .attr("width", 30)
        .attr("height", 20)
        .attr("class", "maxTrussnessText")
        .attr("transform", "translate(324, -3)");
      let labelText = text
        .append("text")
        .attr("x", 3)
        .attr("y", 14)
        .text(this.props.mainStore.graphData.maxTrussness === 0 ? "" : this.props.mainStore.graphData.maxTrussness)
        .style("fill", "#000");
  }
  componentDidMount(){
    this.drawText();
  }
  render() {
    this.drawText();
    let maxTrussness = this.props.mainStore.graphData.maxTrussness;
    return (
      <div className="sliderWrapper">
        <span className="trussnessText">Trussness:&nbsp;&nbsp;</span>
        <Slider
          min={2}
          max={this.props.mainStore.graphData.maxTrussness}
          range={{ draggableTrack: true }}
          style={{ width: 230, float: "right" }}
          // tooltipVisible={true}
          defaultValue={[2, 10000000000000000]}
          onAfterChange={this.setTrussness.bind(this)}
          tooltipPlacement="top"
          marks={{
            2: 2,
          }}
        ></Slider>
      </div>
    );
  }
}
