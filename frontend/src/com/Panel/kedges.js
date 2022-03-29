import React from "react";
import "./index.css";
import * as d3 from "d3";
import { toJS } from "mobx";
import { observer, inject } from "mobx-react";

@inject("mainStore")
@observer
export default class Kedges extends React.Component {
  constructor(props) {
    super(props);
  }
  drawLineChart() {
    const kdata = this.props.mainStore.kData;
    const graphData = this.props.mainStore.graphData;
    const that = this;
    // const dataset = [
    //   { x: 0, y: 11 },
    //   { x: 1, y: 35 },
    //   { x: 2, y: 23 },
    //   { x: 3, y: 78 },
    //   { x: 4, y: 55 },
    //   { x: 5, y: 18 },
    //   { x: 6, y: 98 },
    //   { x: 7, y: 100 },
    //   { x: 8, y: 22 },
    //   { x: 9, y: 65 },
    // ];
    const dataset = kdata.k_add_edges;
    if (this.props.mainStore.graphData.links.length !== 0) {
      const getKData = this.props.mainStore.getKData;
      const margin = { top: 35, right: 28, bottom: 20, left: 39 },
        width = 366 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

      const strokeWidth = 2,
        axisColor = "#959595",
        strokeColor = "#1A91E8";

      d3.selectAll(".linechartsvg").remove();

      // append the svg object to the body of the page
      const maxK = Math.max.apply(
        Math,
        dataset.map((item) => {
          return item.k;
        })
      );
      const maxEdges = Math.max.apply(
        Math,
        dataset.map((item) => {
          return item.edges;
        })
      );
      let svg = d3
        .select("#linechart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "linechartsvg");
      let g = svg
        .append("g")
        .attr("class", "everything")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      let x = d3
        .scaleLinear()
        .domain(
          d3.extent(dataset, function (d) {
            return d.k;
          })
        )
        .range([0, width]);

      let xAxisGenerator = d3.axisBottom().scale(x).ticks(0).tickSize(0);
      let xAxis = g
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxisGenerator)
        .attr("class", "axis");
      let y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(dataset, function (d) {
            return d.edges;
          }),
        ])
        .range([height, 0]);
      let yAxisGenerator = d3.axisLeft().scale(y).ticks(0).tickSize(0);

      let yAxis = g.append("g").call(yAxisGenerator).attr("class", "axis");

      d3.selectAll(".domain").style("stroke", axisColor);
      d3.selectAll(".domain").attr("stroke-width", strokeWidth);

      let extraXAxisLine = g
        .append("line")
        .attr("x1", width)
        .attr("y1", height)
        .attr("x2", width + 5)
        .attr("y2", height)
        .style("stroke-width", strokeWidth)
        .style("stroke", axisColor);
      let extraYAxisLine = g
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", -5)
        .style("stroke-width", strokeWidth)
        .style("stroke", axisColor);

      let arrowX = g
        .append("path")
        .attr("class", "arrowX")
        .attr(
          "d",
          `M${width + 5} ${height - 3} L${width + 10 + 5} ${height} L${
            width + 5
          } ${height + 3} Z`
        )
        .attr("fill", axisColor);

      let arrowY = g
        .append("path")
        .attr("class", "arrowY")
        .attr("d", "M-3 -5 L3 -5 L0 -15 Z")
        .attr("fill", axisColor);
      let textX = g
        .append("text")
        .text("k")
        .attr("x", width + 10 + 5 + 2)
        .attr("y", height)
        .style("font-size", 18);
      let minX = g
        .append("text")
        .text("2")
        .attr("x", -3)
        .attr("y", height + 16);
      let minXLabel = g
        .append("line")
        .attr("x1", 0.5)
        .attr("x2", 0.5)
        .attr("y1", height + 0)
        .attr("y2", height + 4.5)
        // .style("stroke-width", strokeWidth)
        .style("stroke", "#000");

      // .style("font-size", 18);
      let maxX = g
        .append("text")
        .text(this.props.mainStore.graphData.maxTrussness)
        .attr("x", width - 7)
        .attr("y", height + 17);

      let textY = g
        .append("text")
        .text("Restored Edges")
        .attr("x", -39)
        .attr("y", -20)
        .style("font-size", 18);
      let axisTicks = g
        .selectAll(".axistexts")
        .data([0, 0.25, 0.5, 0.75, 1])
        .enter()

        .append("text")
        .attr("class", "axistexts")

        .attr("x", (d, i) => {
          if (i === 0) {
            return -24;
          } else if (i === 4) {
            return -41;
          } else {
            return -31;
          }
        })
        .attr("y", (d) => (1 - d) * height + 4)
        .text((d) => `${d * 100}%-`)
        .style("font-size", 14);
      let clip = g
        .append("defs")
        .append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", 337)
        .attr("height", 248)
        .attr("x", -margin.left)
        .attr("y", -4);

      let brush = d3
        .brushX()
        .extent([
          [0, -6],
          [width, height],
        ])
        .on("end", brushended);

      let space = g.append("g").attr("clip-path", "url(#clip)");

      let lineGenerator = d3
        .line()
        .x((d) => x(d.k))
        .y((d) => y(d.edges));
      let polyline = g
        .append("path")
        .attr("class", "line")
        .attr("d", lineGenerator(dataset))
        .attr("fill", "none")
        .attr("stroke", "#1A91E8")
        .attr("stroke-width", strokeWidth);

      let circles = g
        .selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.k))
        .attr("cy", (d) => y(d.edges))
        .attr("r", 3)
        .attr("stroke", "#1A91E8")
        .attr("stroke-width", strokeWidth)
        .attr("fill", "#fff");
      let maxXLabel = g
        .append("line")
        .attr("x1", width - 0.25)
        .attr("x2", width - 0.25)
        .attr("y1", height + 0)
        .attr("y2", height + 5)
        .style("stroke", "#000");
      space
        .append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [kdata.default_k, maxK].map(x));
      g
        .append("text")
        .text(`${kdata.default_k}`)
        .attr("x", x(kdata.default_k) - 4)
        .attr("y", height + 17)
        .attr("class", "numKtext");
      d3.selectAll(".selection")
        .attr("fill", "#52B6FF")
        .attr("stroke", "#000")
        .attr("stroke-width", strokeWidth);
      let dy = {};
      for (let i = 0; i < that.props.mainStore.kData.k_add_edges.length; i++) {
        // if (that.props.mainStore.kData.k_add_edges[i].k === kdata.default_k) {
        //   dy = that.props.mainStore.kData.k_add_edges[i].edges;
        //   break;
        // }
        dy[that.props.mainStore.kData.k_add_edges[i].k] =
          that.props.mainStore.kData.k_add_edges[i].edges;
      }
      g
        .append("line")
        .attr("x1", 0)
        .attr("x2", x(kdata.default_k) - 4)
        .attr("y1", y(dy[kdata.default_k]))
        .attr("y2", y(dy[kdata.default_k]))
        .style("stroke-width", strokeWidth)
        .style("stroke-dasharray", 5)
        .style("stroke", axisColor)
        .attr("class", "edgesLabelLine");
      g
        .append("line")
        .attr("x1", x(kdata.default_k))
        .attr("x2", x(kdata.default_k))
        .attr("y1", height + 0)
        .attr("y2", height + 5)
        .style("stroke", "#000")
        .attr("class", "textlabelline");

      function brushended() {
        if (!d3.event.sourceEvent) return; // Only transition after input.
        if (!d3.event.selection) return; // Ignore empty selections.
        let xd = d3.event.selection.map(x.invert);
        xd[0] = Math.round(xd[0]);
        xd[1] = maxK;
        that.props.mainStore.getKData(xd[0]);
        d3.select(this).transition().call(d3.event.target.move, xd.map(x));
        d3.select(".numKtext").remove();
        d3.select(".edgesLabelLine").remove();
        d3.select(".textlabelline").remove();
        g
          .append("text")
          .text(`${xd[0]}`)
          .attr("x", x(xd[0]) - 5)
          .attr("y", height + 17)
          .attr("class", "numKtext");
        g
          .append("line")
          .attr("x1", 0)
          .attr("x2", x(xd[0]) - 4)
          .attr("y1", y(dy[xd[0]]))
          .attr("y2", y(dy[xd[0]]))
          .style("stroke-width", strokeWidth)
          .style("stroke-dasharray", 5)
          .style("stroke", axisColor)
          .attr("class", "edgesLabelLine");
        g
          .append("line")
          .attr("x1", x(xd[0]))
          .attr("x2", x(xd[0]))
          .attr("y1", height + 0)
          .attr("y2", height + 5)
          .style("stroke", "#000")
          .attr("class", "textlabelline");
      }
    }

    // function brushing(){
    //   if (!d3.event.sourceEvent) return; // Only transition after input.
    //   if (!d3.event.selection) return; // Ignore empty selections.
    //   let xd = d3.event.selection.map(x.invert);
    //   xd[1] = Math.max.apply(Math,dataset.map(item => { return item.x }))
    //   d3.select(this).call(d3.event.target.move, xd.map(x));
    // }
  }
  // componentDidMount() {
  //   this.drawLineChart();
  // }
  render() {
    this.drawLineChart();
    return (
      <div>
        <div id="linechart" style={{ width: "380px", height: "320px" }}></div>
      </div>
    );
  }
}
