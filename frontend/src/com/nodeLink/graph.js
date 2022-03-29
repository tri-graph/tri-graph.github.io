import React from "react";
import { observer, inject } from "mobx-react";
import { toJS } from "mobx";
import { nodeStyle, linkStyle } from "../../style/nodeLinkStyle";
import NetV from "netv";

@inject("mainStore")
@observer
export default class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.currentCanvas = React.createRef();
  }
  handleClickNode(e) {
    this.setEgoGraphData(e.element.id());
  }
  deepCopy(obj) {
    let a = JSON.stringify(obj);
    let newobj = JSON.parse(a);
    return newobj;
  }
  nodeRefresh = (g, width, height) => {
    const that = this;
    const graphData = this.deepCopy(this.props.mainStore.currentData);
    const trussnessArray = this.deepCopy(this.props.mainStore.trussnessArray);
    this.setEgoGraphData = this.props.mainStore.setEgoGraphData;
    that.highLightLink = this.props.mainStore.highLightLink;
    that.trussnessArray = this.props.mainStore.trussnessArray;
    let minX = 1,
      maxX = -1,
      minY = 1,
      maxY = -1;
    graphData.nodes.forEach((node, i) => {
      minX = Math.min(minX, (node.attributes.x + 1) * 0.5);
      minY = Math.min(minY, (node.attributes.y + 1) * 0.5);
      maxX = Math.max(maxX, (node.attributes.x + 1) * 0.5);
      maxY = Math.max(maxY, (node.attributes.y + 1) * 0.5);
    });
    let sx = minX + (maxX - minX) * 0.5 - 0.5;
    let sy = minY + (maxY - minY) * 0.5 - 0.5;
    if (graphData.nodes.length > 0) {
      let nodes = graphData.nodes.map((node) => {
        return {
          id: node.id,
          x: ((node.attributes.x + 1) * 0.5 - sx) * width,
          y: ((node.attributes.y + 1) * 0.5 - sy) * height,
          // cluster: node.attributes.cluster,
          style: {
            r: nodeStyle.r,
            fill: nodeStyle.fill[
              node.attributes.cluster >= nodeStyle.fill.length - 1
                ? nodeStyle.fill.length - 1
                : node.attributes.cluster
            ],
            strokeColor: nodeStyle.strokeColor,
            strokeWidth: nodeStyle.strokeWidth,
          },
        };
      });
      let links = [];
      let king = {};
      graphData.links.forEach((link) => {
        let o = {
          source: link.source,
          target: link.target,
          trussness: link.attributes.trussness,
          style: {
            strokeColor: linkStyle.strokeColor,
            strokeWidth:
              (this.trussnessArray.length > 1 &&
                link.attributes.trussness < this.trussnessArray[0]) ||
              link.attributes.trussness > this.trussnessArray[1]
                ? 0
                : linkStyle.strokeWidth,
          },
        };
        if(this.highLightLink.length > 0){
          let i = 0;
          for(i = 0; i < this.highLightLink.length; i++){
            if(link.source === this.highLightLink[i][0] && link.target === this.highLightLink[i][1]){
              if(i === 0){
                king = o;
                break;
              }
              else{
                links.push(o);
                break;
              }
            }
          }
          if(i === this.highLightLink.length){
            links.unshift(o);
          }
        }
        else{
          links.unshift(o);
        }
      });
      if(this.highLightLink.length > 0){
        links.push(king);
      }

      let dataset = { nodes: nodes, links: links };
      g.data(dataset);
      g.nodes().forEach((node, i) => {
        node.on("click", this.handleClickNode.bind(this));
      });
      if (this.highLightLink.length > 0) {
        this.highLightLink.forEach((link, index) => {
          let thisLink = g.getLinkByEnds(`${link[0]}`, `${link[1]}`);
          if (
            this.trussnessArray.length > 1 &&
            thisLink.$_attributes.trussness >= this.trussnessArray[0] &&
            thisLink.$_attributes.trussness <= this.trussnessArray[1]
          ) {
            if (index === 0) {
              thisLink.strokeWidth(linkStyle.highLightStrokeWidth);
              thisLink.strokeColor(linkStyle.highLightStrokeColor);
            } else {
              thisLink.strokeColor(linkStyle.highLightTriStrokeColor);
              thisLink.strokeWidth(linkStyle.highLightStrokeTriWidth);
            }
          }
        });
      }
      // console.log(g.links().map((link)=>{
      //   return link.$_style.strokeColor
      // }))
      g.draw();
    }
  };

  componentDidMount() {
    // this.graphData = this.props.mainStore.currentData;
    // if (this.graphData.links.length > 0) {
    this.g = new NetV({
      container: this.currentCanvas.current,
      width: this.props.width,
      height: this.props.height,
      nodeLimit: 100000,
      linkLimit: 1000000,
    });
    this.g.on("zoom", () => {});
    this.g.on("pan", () => {});
    // }
  }

  componentWillUpdate(nextProps) {
    if (
      JSON.stringify(this.props.mainStore.currentData) !==
      JSON.stringify(nextProps.mainStore.currentData)
    ) {
      // console.log("update");
      // this.componentDidMount();
    } else {
      // console.log("not update");
    }
  }

  render() {
    console.log("render graphview");
    if (
      this.props.mainStore.currentData.links.length > 0 &&
      this.currentCanvas.current
    ) {
      this.nodeRefresh(this.g, this.props.width, this.props.height);
    }
    return (
      <div
        className="node_link_canvas"
        width={this.props.width}
        height={this.props.height}
        ref={this.currentCanvas}
      ></div>
    );
  }
}
