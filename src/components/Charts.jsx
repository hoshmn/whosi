import React from "react";
import _ from "lodash";
import Typography from "@mui/material/Typography";
import {
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, emphasize } from "@mui/system";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import NestedBoxes from "./NestedBoxes";
import {
  getRC,
  strokeIntensity,
  fillIntensity,
  themePrimary,
  themeSecondary,
} from "../consts/colors";
import { displayNumber, displayPercent } from "../utils/display";
import {
  CONFIG_FIELDS as C,
  DATA_FIELDS as D,
  GENERATED_FIELDS as G,
} from "../consts/data";

// TODO: CLEAN
const CustomTooltip = ({ active, payload, label, isArea }) => {
  if (active && payload && payload.length) {
    // if lines, stack legend to match line height order
    const payloads = isArea ? payload : _.sortBy(payload, "value");

    let source = null;
    return (
      <Box sx={{ background: "white", p: 2 }} className="custom-tooltip">
        <strong className="label">{label}</strong>
        {payloads.reverse().map((p) => {
          if (p.dataKey.includes("_bounds")) return;

          const bounds = _.get(p.payload, p.dataKey + "_bounds", []);
          const formattedBounds = [D.value_lower, D.value_upper].map((F, i) =>
            _.get(
              p.payload,
              [p.dataKey + "_row", `DISPLAY_${F.toUpperCase()}`],
              bounds[i]
            )
          );

          const v = _.get(
            p.payload,
            [p.dataKey + "_row", G.DISPLAY_VALUE],
            p.value
          );
          // console.log("$$$", v, p.payload);

          // use first source
          source =
            source ||
            _.get(p.payload, [p.dataKey + "_row", D.source_display]) ||
            _.get(p.payload, [p.dataKey + "_row", D.source_database]);

          return (
            <Typography key={p.dataKey}>
              <svg
                width="18"
                viewBox="0 0 160 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="50" fill={p.fill}></circle>
              </svg>
              {p.name}: {v}{" "}
              {!!bounds.length && `(${formattedBounds.join(" - ")})`}
            </Typography>
          );
        })}
        {source && (
          <>
            <br />
            <u>Source</u>: {source}
          </>
        )}
      </Box>
    );
  } else return null;
};

export const Charts = ({ selectedIso, chartData }) => {
  const [hiddenElements, setHiddenElements] = React.useState({});

  const getLineChart = (chart) => {
    const {
      data,
      chartId,
      elements,
      type,
      isPercentage,
      colors,
      elementNameMap,
    } = chart;
    const isArea = type === "area";
    const [, ElementComponent] = isArea ? [AreaChart, Area] : [LineChart, Line];

    const formatter = isPercentage
      ? (v) => displayPercent(v)
      : (v) => displayNumber(v);

    const getName = (elem) => _.get(elementNameMap, elem, elem);

    const onLegendClick = (e) => {
      console.log(e.dataKey);
      const hiddenMap = _.cloneDeep(hiddenElements);
      const hidden = _.get(hiddenMap, [chartId, e.dataKey], false);
      _.set(hiddenMap, [chartId, e.dataKey], !hidden);
      setHiddenElements(hiddenMap);
    };

    return (
      <ResponsiveContainer height={400} width={500}>
        <ComposedChart
          width={500}
          height={400}
          data={data}
          margin={{
            top: 30,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            width={70}
            domain={isPercentage ? [0, 100] : undefined}
            tickFormatter={formatter}
          />
          <Tooltip
            cursor={{ stroke: getRC(themeSecondary, 10), strokeWidth: 1 }}
            content={<CustomTooltip isArea={isArea} source={"source"} />}
          />
          <Legend onClick={onLegendClick} />
          {elements.map((elem, i) => {
            const isBounded =
              !isArea &&
              _.some(data, (d) => _.get(d, [elem + "_bounds"], []).length);
            if (!isBounded) return null;
            return (
              <Area
                key={i + "_b"}
                // type="step"
                dataKey={elem + "_bounds"}
                hide={_.get(hiddenElements, [chartId, elem], false)}
                // stackId={i + 1}
                legendType="none"
                tooltipType="none"
                stroke={getRC(colors[i], strokeIntensity - 3)}
                fill={getRC(colors[i], fillIntensity - 3)}
              />
            );
          })}
          {elements.map((elem, i) => (
            <ElementComponent
              key={i}
              // type="monotone"
              // dataBounds={_.get(elem, [elem + "_bounds"], [])}
              dataKey={elem}
              name={getName(elem)}
              hide={_.get(hiddenElements, [chartId, elem], false)}
              stackId={isArea ? 1 : i + 1000}
              stroke={getRC(colors[i], strokeIntensity)}
              fill={getRC(colors[i], fillIntensity)}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const getTable = (chart) => {
    const { data } = chart;

    const headers = data[0]["values"].map(({ column }) => (
      <TableCell scope="col" key={column}>
        {column}
      </TableCell>
    ));

    debugger;
    const rows = data.map(({ row, values }) => (
      <TableRow key={row}>
        <TableCell scope="row" component="th">
          {row}
        </TableCell>
        {values.map(({ value, column, sheetRow }) => (
          <TableCell key={column}>
            {_.get(sheetRow, G.DISPLAY_VALUE, value) || "N/A"}
            {/* {(value && (sheetRow && sheetRow[G.DISPLAY_VALUE] || value)) || "N/A"} */}
          </TableCell>
        ))}
      </TableRow>
    ));

    return (
      <ResponsiveContainer>
        <TableContainer>
          <Table
            sx={{
              "& tbody tr:nth-child(odd)": {
                background: getRC(themePrimary, 6),
              },
            }}
          >
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
    const { data, elements, colors } = chart;
    const xl = false;
    // console.log(radColors);
    const ratios = elements.map((el) => {
      const val = data[el];
      return val && val / 100;
    });
    // console.log(ratios);
    return (
      <>
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
          fillColors={colors.map((c) => getRC(c, 8))}
          textColors={colors.map((c) => getRC(c, 9))}
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
        <br />
      </>
    );
  };

  const getChart = (chart) => {
    // TODO: simplify
    if (!chart) return null;
    const { type, chartId, name } = chart;

    if (type === "table") {
      return (
        <Box sx={{ flexBasis: "100%", maxWidth: 1000, p: 3 }} key={chartId}>
          <Typography variant="h5" component="h3">
            {name}
          </Typography>
          {getTable(chart)}
        </Box>
      );
    }

    if (type === "nested") {
      return (
        <>
          <Box sx={{ flexBasis: "100%", maxWidth: 800, p: 3 }} key={chartId}>
            <Typography pb={3} variant="h5" component="h3">
              {name}
            </Typography>
            {getNested(chart)}
          </Box>
          <Box sx={{ flexBasis: "100%", height: 0 }} />
        </>
      );
    }
    // if (chart.type === "area") return getAreaChart(chart);
    return (
      <Box p={3} key={chartId}>
        <Typography variant="h5" component="h3">
          {name}
        </Typography>
        {getLineChart(chart)}
      </Box>
    );
  };

  return (
    <Box display="flex" flexWrap="wrap" pt={8}>
      {chartData.map(getChart)}
    </Box>
  );
};
