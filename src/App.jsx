import "./styles.css";
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import getData from "./getData";

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
  const [chartData, setChartData] = React.useState([])

  // React.useEffect(() => {
  //   getData().then((data) => {
  //     console.log("FIN_");
  //     console.log(data);
  //     setChartData(data)
  //   });
  // })
  
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
  ]
  const getAreaChart = ({data}) => {
    console.log("DATA: ", data)
    return (
     <AreaChart
      width={500}
      height={400}
      data={data}
      margin={{
        top: 10,
        right: 30,
        left: 0,
        bottom: 0
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      {data.map((d, i) => (
        <Area
          type="monotone"
          dataKey={d.name}
          stackId={i+1}
          stroke={colors[i]}
          fill={colors[i]}
        />
      ))}
    </AreaChart>
    )
  }
  const getChart= (chart) => {
    console.log("GC: ", chart)
    if (!chart) return null;
    return getAreaChart(chart)
  }
  console.log(chartData)
  return (
    <div>
      welcome"!!
      {chartData.map(chart => getChart)}
      </div>
  );
}
