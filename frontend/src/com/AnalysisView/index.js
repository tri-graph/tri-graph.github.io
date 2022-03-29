import React, { Component } from "react";
import { Table, Tag, Space } from "antd";
import { observer, inject } from "mobx-react";
import "./index.css";

@inject("mainStore")
@observer
export default class AnalysisView extends Component {
  constructor(props) {
    super(props);
  }
  handleChange(value) {
    this.props.mainStore.setCurrentData(value);
  }
  clusterColor = ['rgb(55,126,184)','rgb(166,86,40)','rgb(228,26,28)','rgb(77,175,74)','rgb(152,78,163)','rgb(255,127,0)','rgb(247,129,191)','rgb(224,130,20)','rgb(153,153,153)', 'rgb(217,217,217)'];

  selectRow = (record) => {
    const selectedRowKeys = [...this.props.mainStore.selectedRowKeys];
    if (selectedRowKeys[0] === record.key) {
      selectedRowKeys.splice(0, 1);
      this.props.mainStore.setCurrentData(-1);
    } else {
      selectedRowKeys[0] = record.key;
      this.props.mainStore.setCurrentData(record.key);
    }
    this.props.mainStore.setSelectedRowKeys(selectedRowKeys);
  };
  onSelectedRowKeysChange = (selectedRowKeys) => {
    this.props.mainStore.setSelectedRowKeys(selectedRowKeys);
    this.props.mainStore.setCurrentData(selectedRowKeys[0]);
  };
  render() {
    const dataThings = this.props.mainStore.graphData.clusterArray;
    const dataset = dataThings.map((cluster, index) => {
      return {
        key: cluster.cluster_id,
        cluster: `Cluster${cluster.cluster_id}`,
        nodes: cluster.cluster_size,
        links: cluster.linksSize,
        trussness:
          this.props.mainStore.graphData.cluster2MaxTrussness[
            cluster.cluster_id
          ],
      };
    });
    const columns = [
      {
        title: "Cluster",
        key: "cluster",
        dataIndex: "cluster",
        // width: 90,
        render: (cluster) => (
          <>
            <Tag
              style={{
                fontWeight: "bold",
                color:
                  this.clusterColor[
                    this.props.mainStore.graphData.cluster2Index[
                      +cluster.slice(7)
                    ] >=
                    this.clusterColor.length - 1
                      ? this.clusterColor.length - 1
                      : this.props.mainStore.graphData.cluster2Index[
                          +cluster.slice(7)
                        ]
                  ],
                borderColor:
                  this.clusterColor[
                    this.props.mainStore.graphData.cluster2Index[
                      +cluster.slice(7)
                    ] >=
                    this.clusterColor.length - 1
                      ? this.clusterColor.length - 1
                      : this.props.mainStore.graphData.cluster2Index[
                          +cluster.slice(7)
                        ]
                  ],
                borderWidth: 2.5,
              }}
              key={"cluster"}
            >
              {cluster}
            </Tag>
          </>
        ),
      },
      {
        title: "# Nodes",
        dataIndex: "nodes",
        key: "nodes",
        // width: 95,
      },
      {
        title: "# Links",
        dataIndex: "links",
        key: "links",
        // width: 95,
      },
      {
        title: "Trussness",
        dataIndex: "trussness",
        key: "trussness",
      },
    ];
    console.log("render analysisview ");
    const selectedRowKeys = this.props.mainStore.selectedRowKeys;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange,
      type: "radio",
    };
    return (
      <>
        <div className={"view-class-title"}>Cluster View</div>
        <div className="analysisView scroll">
          <Table
            size="small"
            sticky={true}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={dataset}
            pagination={false}
            onRow={(record) => ({
              onClick: () => {
                this.selectRow(record);
              },
            })}
          />
        </div>
      </>
    );
  }
}
