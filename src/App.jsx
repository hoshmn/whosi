import "./styles.css";
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import getData from "./getData";
import _ from "lodash";

const countries = [
  "CIV",
  "CMR",
  "GHA",
  "GIN",
  "IDN",
  "MOZ",
  "NGA",
  "PHL",
  "TZA",
  "ZMB",
]

// const data = [
//   {
//     name: "Page A",
//     uv: 4000,
//     pv: 2400,
//     amt: 2400
//   },
//   {
//     name: "Page B",
//     uv: 3000,
//     pv: 1398,
//     amt: 2210
//   },
//   {
//     name: "Page C",
//     uv: 2000,
//     pv: 9800,
//     amt: 2290
//   },
//   {
//     name: "Page D",
//     uv: 2780,
//     pv: 3908,
//     amt: 2000
//   },
//   {
//     name: "Page E",
//     uv: 1890,
//     pv: 4800,
//     amt: 2181
//   },
//   {
//     name: "Page F",
//     uv: 2390,
//     pv: 3800,
//     amt: 2500
//   },
//   {
//     name: "Page G",
//     uv: 3490,
//     pv: 4300,
//     amt: 5150
//   }
//   ]

export default function App() {
  const [chartData, setChartData] = React.useState([]);
  const [iso, setIso] = React.useState(countries[0]);

  React.useEffect(() => {
    getData(iso).then((data) => {
      // alert(1)
      console.log("@@@ ALL DATA: ");
      console.log(data);
      setChartData(data);
    });
  }, [iso]);

  const colors = ["#8884d8", "#82ca9d", "#ffc658"];

  const getLineChart = (chart, i) => {
    const { data, elements } = chart;
    // console.log("DATA: ", data);
    // console.log("elements: ", elements);
    return (
      <div key={i}>
        <>{chart.chartId}</>
        <LineChart
          width={500}
          height={400}
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {elements.map((elem, i) => (
            <Line
              type="monotone"
              dataKey={elem}
              stackId={i + 1}
              stroke={colors[i]}
              fill={colors[i]}
            />
          ))}
        </LineChart>
      </div>
    );
  };

  const getAreaChart = (chart, i) => {
    const { data, elements } = chart;
    // console.log("DATA: ", data);
    // console.log("elements: ", elements);
    return (
      <div key={i}>
        <>{chart.chartId}</>
        <AreaChart
          width={500}
          height={400}
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {elements.map((elem, i) => (
            <Area
              type="monotone"
              dataKey={elem}
              stackId={i + 1}
              stroke={colors[i]}
              fill={colors[i]}
            />
          ))}
        </AreaChart>
      </div>
    );
  };
  const getChart = (chart, i) => {
    // console.log("GC: ", chart);
    if (!chart) return null;
    if (chart.type === "area") return getAreaChart(chart, i);
    return getLineChart(chart, i);
  };

  const updateCountry = (e) => {
    setIso(e.target.value);
  };

  // console.log("*", chartData);
  const loading = !_.some(chartData, c => c && c.country_iso_code === iso)
  return (
    <div>
      <select name="country" onChange={updateCountry}>
        {countries.map((c) => ( 
          <option id={c} key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <br />
        {/* todo add key */}
      {loading ? "loading..." : chartData.map(getChart)}
    </div>
  );
}
