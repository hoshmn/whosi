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
import { Box, useTheme } from "@mui/system";
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
  MULTI_LINE_TEXT_DELIN,
} from "../consts/data";
import {
  Button,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
} from "@mui/material";

// TODO: standardize / create sane system for styles
// TODO: CLEAN / EXTRACt this and other components
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

export const Charts = ({
  selectedIso,
  chartData,
  countries,
  dashExpanded,
  toggleDashExpanded,
}) => {
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
      <ResponsiveContainer
        // needed for proper resizing https://github.com/recharts/recharts/issues/172#issuecomment-307858843
        width="99%"
        aspect={1.25}
        // height={400}
        maxHeight={400}
        // maxWidth={600}
      >
        <ComposedChart
          // width={500}
          // height={400}
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
            width={80}
            domain={isPercentage ? [0, 100] : undefined}
            tickFormatter={formatter}
          />
          <Tooltip
            cursor={{ stroke: getRC(themeSecondary, 10), strokeWidth: 1 }}
            content={<CustomTooltip isArea={isArea} />}
          />
          <Legend
            onClick={onLegendClick}
            iconSize={isArea ? 8 : 14}
            iconType={isArea && "circle"}
          />
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
    const { data, hideRowNames } = chart;

    const firstRow = data[0];

    // TODO: empty row? skip title?
    if (!firstRow) return null;
    // const columnsNamed = _.some(data[0]["values"], "columnNamed");
    const headers =
      // columnsNamed &&
      firstRow["values"].map(({ columnName, columnNamed }) => (
        <TableCell scope="col" key={columnName}>
          {columnNamed && columnName}
        </TableCell>
      ));

    const rows = data.map(({ rowName, values }) => (
      <TableRow key={rowName}>
        {!hideRowNames && (
          <TableCell scope="row" component="th">
            {rowName}
          </TableCell>
        )}
        {values.map(({ value, columnName, sheetRow, color }) => (
          <TableCell
            key={columnName}
            sx={{
              background: color,
            }}
          >
            {/*  */}
            {/* {_.get(sheetRow, G.DISPLAY_VALUE, value) || "N/A"} (move to getData?) */}
            {/* to not overwrite "" with "N/A":  */}
            {_.get(sheetRow, G.DISPLAY_VALUE, _.get([value], 0, "N/A"))}
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
              "& tbody tr:nth-of-type(odd)": {
                background: getRC(themePrimary, 6),
              },
              "& td, & thead th": {
                textAlign: "right",
              },
              "& th": {
                fontWeight: "bold",
                minWidth: "60px",
              },
            }}
          >
            <TableHead>
              <TableRow>
                {!hideRowNames && <TableCell scope="col"></TableCell>}
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
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.down("sm"));
    const isXl = useMediaQuery(theme.breakpoints.up("md"));
    const { data, elements, colors, elementNameMap } = chart;
    const xl = false;
    // console.log(radColors);
    const ratios = elements.map((el) => {
      const val = data[el];
      return val && val / 100;
    });
    const content = elements.map((el) => {
      const text = elementNameMap[el];
      return { below: text.split(MULTI_LINE_TEXT_DELIN) };
    });
    // console.log(ratios);
    return (
      <>
        <NestedBoxes
          // circle={true}
          // classes={xl ? "xl" : ""}
          title={"title"}
          bufferRatio={!isSm ? 0.8 : 0.2}
          lineHeight={!isSm ? 1.4 : 1.1}
          textBufferRatio={0.2}
          firstSide={20}
          horizontal={!isSm}
          ratios={ratios}
          fillColors={colors.map((c) => getRC(c, 8))}
          textColors={colors.map((c) => getRC(c, 9))}
          content={content}
        />
        <br />
      </>
    );
  };

  const getIntro = (chart) => {
    const country = countries.find((c) => c.iso === selectedIso);
    return (
      <>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 500,
            lineHeight: 1,
            fontSize: { lg: "6rem" },
            maxWidth: { lg: 760, xl: "100%" },
            mb: { sm: 1, lg: 2 },
          }}
        >
          {country && country.name}
        </Typography>
        <Box
          sx={{
            display: { sm: "flex" },
            "& dl:not(:last-child)": { mr: { sm: 4, md: 10 } },
            "& dt h2": {
              fontWeight: 100,
              letterSpacing: ".8px",
              textTransform: "uppercase",
            },
            "& dt, dd": { m: 0 },
          }}
        >
          {chart.elements.map((elem) => {
            return (
              <dl key={elem}>
                <dt>
                  <Typography variant="h6" component="h2">
                    {_.get(
                      chart,
                      ["textValues", `${elem}_row`, G.DISPLAY_NAME],
                      ""
                    )}
                  </Typography>
                </dt>
                <dd>
                  <Typography variant="h4" component="h2">
                    {_.get(
                      chart,
                      ["textValues", `${elem}_row`, G.DISPLAY_VALUE],
                      chart.textValues[elem]
                    )}
                  </Typography>
                </dd>
              </dl>
            );
          })}
        </Box>
      </>
    );
  };

  const getChart = (chart) => {
    // TODO: simplify
    if (!chart) return null;

    const { type, chartId, name, hiddenUntilExpand } = chart;
    if (hiddenUntilExpand && !dashExpanded) return null;

    if (type === "accordion") {
      // for clarity...
      const element = chart;

      const showHide = dashExpanded ? "Hide" : "Show";
      const caret = <b>↑</b>;
      return (
        <Box
          sx={{
            display: "block",
            width: "100%",
            pt: 1,
            pb: 2,
            pl: 3,
            "& button": { p: 0, textTransform: "none" },
            "& b": {
              px: 1,
              transform: `rotate(${dashExpanded ? "0" : "180"}deg)`,
              transition: "transform .2s linear",
            },
          }}
        >
          <Button onClick={toggleDashExpanded}>
            {showHide} {element.text} {caret}
          </Button>
        </Box>
      );
    }

    if (type === "link") {
      // for clarity...
      const element = chart;
      const country = countries.find((c) => c.iso === selectedIso);

      const url = _.get(country, element.elementId);
      console.log(chart);
      return (
        <Box
          sx={{
            display: "block",
            width: "100%",
            pt: 1,
            pb: 2,
            pl: 3,
          }}
        >
          <Link target="_blank" rel="noopener noreferrer" href={url}>
            {element.text}
          </Link>
        </Box>
      );
    }

    // if (type === "text") {
    if (chartId === "intro") {
      return (
        <Box
          sx={{
            // background: { xs: "red", sm: "blue", md: "green", lg: "yellow", xl: "purple" },
            flexBasis: { xs: "100%", xl: 600 },
            flexGrow: { xl: 0 },
            p: 3,
            // display: {md: "flex"},
          }}
          key={chartId}
        >
          {getIntro(chart)}
        </Box>
      );
    }

    if (type === "table" || type === "table_list") {
      return (
        <Box sx={{ flexBasis: "100%", maxWidth: 864, p: 3 }} key={chartId}>
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
          <Box
            sx={{
              flexBasis: { xs: "100%", xl: 700 },
              flexGrow: { xl: 1 },
              flexShrink: { xl: 1 },
              mr: "auto",
              ml: { xl: "auto" },
              maxWidth: 864,
              p: 3,
            }}
            key={chartId}
          >
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
    if (type && type !== "line") {
      console.warn("Unknown type: ", type);
      return null;
    }

    return (
      <Box
        key={chartId}
        sx={{
          width: "100%",
          maxWidth: { md: "44%", xl: "29%" },
          p: 3,
        }}
      >
        <Typography variant="h5" component="h3">
          {name}
        </Typography>
        {getLineChart(chart)}
      </Box>
    );
  };

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      pt={8}
      sx={{
        justifyContent: { xs: "space-evenly", md: "space-between" },
      }}
    >
      {chartData.map(getChart)}
    </Box>
  );
};
