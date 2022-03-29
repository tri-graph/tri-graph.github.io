import React from "react";
import "./index.css";
import { Divider } from "antd";
import { Select } from "antd";
import { observer, inject } from "mobx-react";

const { Option } = Select;

@inject("mainStore")
@observer
export default class Panel extends React.Component {
  constructor(props) {
    super(props);
  }
  handleChange(value) {
    this.props.mainStore.setGraphData(value);
  }
  render() {
    console.log("render panel");
    // const default_graph = "";
    // this.props.mainStore.setGraphData(default_graph);

    return (
      <div className="graphEditor">
        {/* <Divider>Graph Editor</Divider> */}
        <div className="selectWrapper">
          <span className="graphTitle">Graph Data:&nbsp;&nbsp;</span>
          <Select
            // defaultValue={default_graph}
            style={{
              width: 210,
              textAlign: "center",
              fontSize: "17px",
              fontWeight: "bold",
            }}
            onChange={this.handleChange.bind(this)}
          >
            {/* <Option value="test">test</Option>
            <Option value="miserables">miserables</Option>
            <Option value="email-Eu-core">email-Eu-core</Option>
            <Option value="Wiki-Vote">Wiki-Vote</Option>
            <Option value="Rice31">Rice31</Option>
            <Option value="harvard1">harvard1</Option>
            <Option value="Caltech36">Caltech36</Option>
            <Option value="Smith60">Smith60</Option>
            <Option value="Swarthmore42">Swarthmore42</Option>
            <Option value="Wellesley22">Wellesley22</Option> */}
            <Option value="USFCA72">FB-USFCA72</Option>
            <Option value="econ-orani678">ORANI678</Option>
            {/* <Option value="Mich67">Mich67</Option> */}
            
          </Select>
        </div>
      </div>
    );
  }
}
