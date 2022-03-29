import React, { Component } from "react";
import "./index.css";
import Ktrus from "./ktrus";
import Panel from "./panel";
import Kedges from "./kedges";
import { Divider } from "antd";
import { Select } from "antd";
import { Slider } from "antd";
import { Input, Space } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import { observer, inject } from "mobx-react";

const { Option } = Select;
const { Search } = Input;
export default class Control extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <div className={"view-class-title"}>Graph Editor</div>
        <div className="panelView">
          <div className="graphEditor">
            <Panel />
            <Ktrus />
          </div>
          <Kedges />
        </div>
      </div>
    );
  }
}
