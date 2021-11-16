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
  ResponsiveContainer,
  Legend,
} from "recharts";
import getData from "./getData";
import _ from "lodash";
import { Box } from "@mui/system";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Paper, Typography } from "@mui/material";
import NestedBoxes from "./NestedBoxes";
import {
  tomato,
  red,
  crimson,
  pink,
  plum,
  purple,
  violet,
  indigo,
  blue,
  cyan,
  teal,
  green,
  grass,
  orange,
  brown,
  sky,
  mint,
  lime,
  yellow,
  amber,
  gray,
  mauve,
  slate,
  sage,
  olive,
  sand,
  gold,
  bronze,
} from "@radix-ui/colors";

const radColors = [
  tomato,
  red,
  crimson,
  pink,
  plum,
  purple,
  violet,
  indigo,
  blue,
  cyan,
  teal,
  green,
  grass,
  orange,
  brown,
  sky,
  mint,
  lime,
  yellow,
  amber,
  gray,
  mauve,
  slate,
  sage,
  olive,
  sand,
  gold,
  bronze,
];

const SHOW_COLORS = false;

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
];

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
//   ]

const coreColors = [orange, grass, plum];
const altColors = [tomato, indigo, gold];
const alt2Colors = [sky, brown, violet, sand];
const strokeIntensity = 10;
const fillIntensity = 7;

export default function App() {
  const [chartData, setChartData] = React.useState([]);
  const [iso, setIso] = React.useState(countries[0]);

  React.useEffect(() => {
    getData(iso).then((data) => {
      console.log("@@@ ALL DATA: ");
      console.log(data);
      setChartData(data);
    });
  }, [iso]);

  const getLineChart = (chart) => {
    const { data, elements, type } = chart;
    const isArea = type === "area";
    const [ChartComponent, ElementComponent] = isArea
      ? [AreaChart, Area]
      : [LineChart, Line];

    // todo: add to Sheet
    const colors =
      chart.chartId === "plhiv_diagnosis" ||
      chart.chartId === "testing_coverage"
        ? altColors
        : coreColors;

    return (
      <ResponsiveContainer height={400}>
        <ChartComponent
          width={500}
          height={400}
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 10,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {elements.map((elem, i) => (
            <ElementComponent
              type="monotone"
              dataKey={elem}
              stackId={isArea ? 1 : i + 1}
              stroke={getRC(colors[i], strokeIntensity)}
              fill={getRC(colors[i], fillIntensity)}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  // const getAreaChart = (chart, i) => {
  //   const { data, elements } = chart;

  //   return (
  //     <div key={i}>
  //       <>{chart.name}</>
  //       <AreaChart
  //         width={500}
  //         height={400}
  //         data={data}
  //         margin={{
  //           top: 10,
  //           right: 30,
  //           left: 0,
  //           bottom: 0,
  //         }}
  //       >
  //         <CartesianGrid strokeDasharray="3 3" />
  //         <XAxis dataKey="name" />
  //         <YAxis />
  //         <Tooltip />
  //         <Legend />
  //         {elements.map((elem, i) => (
  //           <Area
  //             type="monotone"
  //             dataKey={elem}
  //             stackId="1"
  //             stroke={colors[i]}
  //             fill={colors[i]}
  //           />
  //         ))}
  //       </AreaChart>
  //     </div>
  //   );
  // };

  const getTable = (chart) => {
    const { data } = chart;

    const headers = data[0]["values"].map(({ column }) => (
      <TableCell scope="col" key={column}>
        {column}
      </TableCell>
    ));

    const rows = data.map(({ row, values }) => (
      <TableRow key={row}>
        <TableCell scope="row" component="th">
          {row}
        </TableCell>
        {values.map(({ value, column }) => (
          <TableCell key={column}>{value && value["DISPLAY_VALUE"]}</TableCell>
        ))}
      </TableRow>
    ));

    return (
      <ResponsiveContainer>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell scope="col"></TableCell>
                {headers}
              </TableRow>
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </TableContainer>
      </ResponsiveContainer>
    );
  };

  const getNested = (chart) => {
    const { data, elements } = chart;
    const xl = false;
    console.log(radColors);
    const ratios = elements.map((el) => {
      const val = data[el];
      return val && val / 100;
    });
    console.log(ratios);
    return (
      <NestedBoxes
        // circle={true}
        classes={xl ? "xl" : ""}
        title={"title"}
        bufferRatio={xl ? 0.8 : 0.2}
        lineHeight={xl ? 1.4 : 1.1}
        textBufferRatio={0.2}
        firstSide={20}
        horizontal={true}
        ratios={ratios}
        fillColors={alt2Colors.map((c) => getRC(c, 8))}
        textColors={alt2Colors.map((c) => getRC(c, 9))}
        content={[
          {
            // inner: status,
            below: ["of people living with", "HIV know their status"],
          },
          {
            // inner: art,
            below: [
              "of people living with",
              "HIV who know their status",
              "are on treatment",
            ],
          },
          {
            // inner: suppression,
            below: ["of people on treatment", "are virally suppressed"],
          },
        ]}
      />
    );
  };

  const getChart = (chart) => {
    // console.log("GC: ", chart);
    if (!chart) return null;
    if (chart.type === "table") return getTable(chart);
    if (chart.type === "nested") return getNested(chart);
    // if (chart.type === "area") return getAreaChart(chart);
    return getLineChart(chart);
  };

  const updateCountry = (e) => {
    setIso(e.target.value);
  };

  // console.log("*", chartData);
  const loading = !_.some(chartData, (c) => c && c.country_iso_code === iso);
  return (
    <Paper elevation={0} style={{ background: "none", color: getRC(mauve, 11) }}>
      <select name="country" onChange={updateCountry}>
        {countries.map((c) => (
          <option id={c} key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <br />

      {loading
        ? "loading..."
        : chartData.map(
            (c) =>
              c && (
                <Box pt={6} pl={3} key={c.chartId}>
                  <Typography variant="h5" component="h3">
                    {c.name}
                  </Typography>
                  {getChart(c)}
                </Box>
              )
          )}
      {SHOW_COLORS &&
        radColors.map((rc) => (
          <>
            <br></br>
            {_.map(Object.keys(radColors[0]), (meh, idx) => (
              <span
                style={{
                  background: getRC(rc, idx + 1),
                  height: "70px",
                  width: "70px",
                  display: "inline-block",
                  textAlign: "center",
                }}
              >
                {idx + 1}
              </span>
            ))}
            {Object.keys(rc)[0].replace(/\d/, "")}
          </>
        ))}
    </Paper>
  );
}

function getRC(radColor, idx) {
  const c1 = Object.keys(radColor)[0];
  const c = c1.replace(/\d/, "") + idx;
  return radColor[c];
}
