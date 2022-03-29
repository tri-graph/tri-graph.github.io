import axios from "axios";

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};
// const URL_ROOT = "http://127.0.0.1:5000/";
const URL_ROOT = "http://10.76.0.160:5000/";
function fireAjax(method, URL, data) {
  if (method === "POST") {
    return axios
      .post(URL_ROOT + URL, data, { defaultHeaders })
      .then((response) => {
        console.log("server response:", response.data);
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  } else if (method === "GET") {
  }
}

//新增的
export const fetchGraph = (params) => fireAjax("POST", "get_graph", params);
export const fetchEgoGraph = (params) =>
  fireAjax("POST", "get_egonetwork", params);
export const fetchKGraph = (params) => fireAjax("POST", "set_k", params);
