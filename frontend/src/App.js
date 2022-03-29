import React, { Component } from "react";
import "./App.css";
import Control from "./com/Panel/control.js";
import EdgeView from "./com/EdgeView";
import AnalysisView from "./com/AnalysisView";
import GraphView from "./com/GraphView";
import Egonet from "./com/Panel/egonet";
import { toJS } from "mobx";
import G from "./assets/G.svg";
import help from "./assets/help.svg";
import { transform } from "@babel/core";

function App() {
  window.toJS = toJS;

  // const data = await fetchClientData({
  //   index: toJS(this.props.mainStore.client),
  // });

  return (
    <div>
      <div
        style={{
          width: "1920px",
          height: "40px",
          backgroundColor: "#17225e",
          padding: "0 0 0 14px",
          color: "#fff",
          fontSize: "22px",
          lineHeight: "40px",
        }}
      >
        Tri
        <img src={G} width={17} height={17} style={{ marginBottom: "4px" }} />
        raph
        <img
          src={help}
          width={18}
          height={18}
          style={{ marginLeft: "1793px", marginBottom: "7px" }}
        />
      </div>
      <div
        style={{
          width: "1920px",
          height: "1040px",
          padding: "12px 12px 12px 10px",
          display: "grid",
          gridTemplateColumns: "392fr 960fr 528fr",
          gridTemplateRows: "511px 493px",
          gridGap: "12px 10px",
          placeItems: "center center",
          gridAutoFlow: "column",
          backgroundColor: "#f2f2f2",
        }}
      >
        <div
          className="wrapper"
          style={{
            placeSelf: "stretch stretch",
            gridColumn: "1 / 2",
            gridRow: "1 / 2",
          }}
        >
          <Control />
        </div>
        <div
          className="wrapper"
          id="edgeViewWrapper"
          style={{
            placeSelf: "stretch stretch",
            gridColumn: "3 / 4",
            gridRow: "1 / 2",
          }}
        >
          <EdgeView />
        </div>
        <div
          className="wrapper"
          id="graphViewWrapper"
          style={{
            placeSelf: "stretch stretch",
            gridColumn: "2 / 3",
            gridRow: "1 / 3",
          }}
        >
          <GraphView />
        </div>
        <div
          className="wrapper"
          style={{
            placeSelf: "stretch stretch",
            gridColumn: "1 / 2",
            gridRow: "2 / 3",
          }}
        >
          <AnalysisView />
        </div>
        <div
          className="wrapper"
          style={{
            placeSelf: "stretch stretch",
            gridColumn: "3 / 4",
            gridRow: "2 / 3",
          }}
        >
          <Egonet />
        </div>
      </div>
    </div>
  );
}

export default App;
