import React from "react";
import { observer, inject } from "mobx-react";
import { toJS } from "mobx";
import { nodeStyle, linkStyle } from "../../style/nodeLinkStyle";

@inject("mainStore")
@observer
export default class EgoGraph extends React.Component {
  constructor(props) {
    super(props);
    this.currentCanvas = React.createRef();
  }

  nodeRefresh = (g, width, height) => {
    this.graphData = this.props.mainStore.egoGraphData;
    this.globalData = this.props.mainStore.graphData;
    this.center_id = this.props.mainStore.ego_id;

    g.beginBatch();
    let minX = 1,
      maxX = -1,
      minY = 1,
      maxY = -1;
    g.nodes().forEach((node, i) => {
      minX = Math.min(minX, node._attribute.attributes.x);
      minY = Math.min(minY, node._attribute.attributes.y);
      maxX = Math.max(maxX, node._attribute.attributes.x);
      maxY = Math.max(maxY, node._attribute.attributes.y);
    });
    let sx = minX + (maxX - minX) * 0.5 - 0.5;
    let sy = minY + (maxY - minY) * 0.5 - 0.5;
    g.nodes().forEach((node, i) => {
      node.fill =
        nodeStyle.fill[
          this.globalData.cluster2Index[node._attribute.cluster] >=
          nodeStyle.fill.length - 1
            ? nodeStyle.fill.length - 1
            : this.globalData.cluster2Index[node._attribute.attributes.cluster]
        ];
      node.renderID = i;
      node.r = 2 * nodeStyle.r;
      if (node._attribute.id === this.center_id) {
        node.strokeWidth = nodeStyle.egoStrokeWidth;
        node.strokeColor = nodeStyle.egoStrokeColor;
        node.x = (node._attribute.attributes.x - sx) * width;
        node.y = (node._attribute.attributes.y - sy) * height;
      } else {
        node.strokeWidth = nodeStyle.strokeWidth;
        node.strokeColor = nodeStyle.strokeColor;
        node.x = (node._attribute.attributes.x - sx) * width;
        node.y = (node._attribute.attributes.y - sy) * height;
      }
    });
    g.links().forEach((link) => {
      (link.strokeColor = {
        //103, 105, 107
        r: 200 / 255,
        g: 200 / 255,
        b: 200 / 255,
        a: 0.3,
      }),
        (link.strokeWidth = 2 * linkStyle.strokeWidth);
    });
    g.endBatch();
    g.refresh();
  };

  render() {
    const { width, height } = this.props;
    if (this.currentCanvas.current) {
      const graphData = toJS(this.props.mainStore.egoGraphData);
      this.g = new G({
        data: graphData,
        container: this.currentCanvas.current,
      });
      this.g.on("zoom", () => {});
      this.g.on("pan", () => {});

      this.nodeRefresh(
        this.g,
        this.currentCanvas.current.width,
        this.currentCanvas.current.height
      );
    }

    console.log(toJS(this.props.mainStore.graphData.maxtrussness));
    console.log("render egoview");
    return (
      <canvas
        className="node_link_canvas"
        width={width}
        height={height}
        ref={this.currentCanvas}
      ></canvas>
    );
  }
}
