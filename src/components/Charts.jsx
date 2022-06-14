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
  radColors,
} from "../consts/colors";
import { displayNumber, displayPercent, transformLink } from "../utils/display";
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
import {
  findLeastUpdatedDeliverableCell,
  insertNumberIcons,
} from "../utils/data";
import clsx from "clsx";

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
  legendData,
  countries,
  dashExpanded,
  toggleDashExpanded,
}) => {
  const [hiddenElements, setHiddenElements] = React.useState({});
  const [expandedGroupMap, setExpandedGroupMap] = React.useState({});

  const country = countries.find((c) => c.iso === selectedIso);
  if (!country) return null;

  const getLineAreaChart = (chart) => {
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

  const getCollapsibleTableRows = (chart) => {
    const { data, groupByField, chartId } = chart;
    const groups = [];
    const dataGrouped = _.groupBy(data, (r) => {
      const v = r.values.find((c) => c.sourceColumnName === groupByField);
      if (v && v.value) {
        if (!groups.includes(v.value)) groups.push(v.value);
        return v.value;
      } else {
        console.warn("collapsible table row without groupBy field: ", r);
        return "__UNKNOWN__";
      }
    });
    const pData = groups.reduce((result, group) => {
      const groupData = dataGrouped[group];
      const isExpanded = _.get(expandedGroupMap, [chartId, group], false);
      const singleRowGroup = groupData.length === 1;

      if (singleRowGroup) {
        groupData[0].singleRowGroup = 1;
        result.push(...groupData);
        return result;
      } else if (isExpanded) {
        result.push(...groupData);
        return result;
      } else {
        // create agg row
        const collapsedRow = _.cloneDeep(groupData[0]);
        // TODO: logic is specific to DELIVERABLE chart. make universal.
        collapsedRow.values = collapsedRow.values.map((c) => {
          if (c.sourceColumnName === D.Supplier) {
            c.value = `<b>${group}</b>`;
            return c;
          } else if (c.sourceColumnName === D.Deliverable) {
            c.value = `<em>${groupData.length} items (click to view)</em>`;
            return c;
          } else if (D.REGEX.quarter.test(c.sourceColumnName)) {
            const ludr = findLeastUpdatedDeliverableCell(groupData, c);
            return ludr;
          } else {
            return c;
          }
        });

        result.push(collapsedRow);
        return result;
      }
    }, []);

    return pData;
  };

  const getTable = (chart) => {
    const { data, hideRowNames, chartId, collapsibleTL } = chart;

    const firstRow = data[0];

    if (!firstRow) return null;
    // const columnsNamed = _.some(pData[0]["values"], "columnNamed");
    const hasHeaders = firstRow["values"].some(
      ({ columnName, columnNamed }) => columnNamed && columnName
    );

    const headers =
      // columnsNamed &&
      hasHeaders &&
      firstRow["values"].map(({ columnName, columnNamed }) => (
        <TableCell scope="col" key={columnName}>
          {columnNamed && columnName}
        </TableCell>
      ));
    const pData = collapsibleTL ? getCollapsibleTableRows(chart) : data;

    let hasIcons = false;
    const rows = pData.map(
      ({ rowName, values, iconPath, groupByGroup, singleRowGroup }) => {
        hasIcons = hasIcons || iconPath;

        const isExpanded = _.get(
          expandedGroupMap,
          [chartId, groupByGroup],
          false
        );
        const clickHandler = () => {
          if (!collapsibleTL) return;

          const egm = _.cloneDeep(expandedGroupMap);
          _.set(egm, [chartId, groupByGroup], !isExpanded);
          setExpandedGroupMap(egm);
        };

        const expandible = collapsibleTL && !singleRowGroup;
        const title = !expandible
          ? ""
          : isExpanded
          ? "click to collapse"
          : "click to expand";
        return (
          <TableRow
            title={title}
            key={rowName}
            onClick={clickHandler}
            sx={{
              cursor: expandible && "pointer",
              // "& .item-count": {
              //   whiteSpace: "nowrap",
              // },
            }}
          >
            {!hideRowNames && (
              <TableCell scope="row" component="th">
                {iconPath && (
                  <>
                    <img className="icon" src={`assets/${iconPath}.png`} />
                    <br />
                  </>
                )}
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
                <Typography
                  dangerouslySetInnerHTML={{
                    __html: _.get(
                      sheetRow,
                      G.DISPLAY_VALUE,
                      insertNumberIcons(_.get([value], 0, "N/A"))
                    ),
                  }}
                />
                {/* {(value && (sheetRow && sheetRow[G.DISPLAY_VALUE] || value)) || "N/A"} */}
              </TableCell>
            ))}
          </TableRow>
        );
      }
    );

    const isSingleColumn = firstRow["values"].length === 1;

    return (
      <ResponsiveContainer>
        <TableContainer sx={{ pt: 1 }}>
          <Table
            sx={{
              background: "white",
              border: "1px solid rgba(224, 224, 224, 1)",
              // "& tbody th:first-of-type::before": {
              // borderLeft: `solid 2px ${getRC(themePrimary, 6)}`,
              // },
              // "& tbody td:last-of-type::before": {
              // borderRight: `solid 2px ${getRC(themePrimary, 6)}`,
              // },
              "& tbody tr:nth-of-type(even)": {
                background: "white",
              },
              "& tbody tr:nth-of-type(odd)": {
                background: hasIcons ? "white" : getRC(radColors.sand, 2),
                // background: getRC(themePrimary, 7),
              },
              // "& td, & thead th": {
              "& td, & th": {
                // single column tables w/o row names get left justified (more like a list)
                // textAlign: isSingleColumn && hideRowNames ? "left" : "right",
                textAlign: "left",
                fontSize: { xs: "small", lg: "smaller" },
              },
              "& th": {
                fontWeight: "bold",
                minWidth: "60px",
              },
              "& img.icon": {
                pb: 1,
                pl: 1,
                height: {
                  xs: 60,
                  sm: 80,
                  md: 100,
                },
              },
            }}
          >
            {hasHeaders && (
              <TableHead>
                <TableRow>
                  {!hideRowNames && <TableCell scope="col"></TableCell>}
                  {headers}
                </TableRow>
              </TableHead>
            )}
            <TableBody>{rows}</TableBody>
          </Table>
        </TableContainer>
      </ResponsiveContainer>
    );
  };

  const getNested = (chart) => {
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.down("sm"));
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
    // #NFS (Nested Flex Solution): nested boxes share the intro line on md+
    return (
      <>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 500,
            lineHeight: 1,
            // fontSize: 32,
            maxWidth: { lg: 760, xl: "100%" },
            mb: { sm: 1, lg: 2 },
            "& div": {
              color: getRC(themeSecondary, 11),
              fontWeight: "200",
              fontSize: "20px",
              pt: 1,
            },
          }}
        >
          {country.name}
          {!country.approved && <div>Pending review</div>}
        </Typography>
        <Box
          sx={{
            // #NFS - intro details are stacked on xs, md, lg
            display: { sm: "flex", md: "unset", xl: "flex" },
            "& dl:not(:last-child)": { mr: 3 },
            "& dt h2": {
              fontWeight: 100,
              letterSpacing: ".8px",
              textTransform: "uppercase",
            },
            "& dt, dd": {
              m: 0,
              "& h2": {
                fontSize: 18,
              },
            },
          }}
        >
          {chart.elements.map((elem) => {
            return (
              <dl key={elem}>
                <dt>
                  <Typography component="h2">
                    {_.get(
                      chart,
                      ["textValues", `${elem}_row`, G.DISPLAY_NAME],
                      ""
                    )}
                  </Typography>
                </dt>
                <dd>
                  <Typography
                    component="h2"
                    dangerouslySetInnerHTML={{
                      __html: transformLink(
                        _.get(
                          chart,
                          ["textValues", `${elem}_row`, G.DISPLAY_VALUE],
                          chart.textValues[elem]
                        )
                      ),
                    }}
                  />
                </dd>
              </dl>
            );
          })}
        </Box>
      </>
    );
  };

  const getLegend = (chart = {}) => {
    const { chartId, hiddenUntilExpand } = chart;
    const legend = legendData[chartId];

    if (!legend || (hiddenUntilExpand && !dashExpanded)) return;

    const sections = [];
    legend.forEach((row) => {
      if (!row.text) {
        sections.push({
          title: row.heading,
          items: [],
        });
        return;
      }

      if (!sections.length) {
        sections.push({ items: [] });
      }
      sections[sections.length - 1].items.push(row);
    });
    return (
      <Box
        sx={{
          my: 1,
          mx: 2,
          mr: "auto",
          // mr: 2,
          // background: "white",
          // p: { xs: 1, sm: 2, md: 3 },
          ".legend-sections": {
            display: { md: "flex" },
            gap: 3,
          },
          ".legend-section:not(:first-child)": {
            pt: { xs: 1.5, md: "unset" },
          },
          "& .MuiTypography-body1": {
            fontWeight: 500,
            pb: 1,
          },
          "& td": {
            py: 0.5,
            border: "none",
            fontSize: "small",
            px: 2,
            py: 0.5,
          },
          "& tr:not(.colored)": {
            "& td": {
              pl: 0,
              pb: { xs: 0, md: 0.5 },
            },
          },
        }}
      >
        {/* <Typography variant="h3">Legend</Typography> */}
        <Box className="legend-sections">
          {sections.map((section, i) => {
            return (
              <Box className="legend-section" key={i}>
                <Typography variant="body1">{section.title}</Typography>
                <Table>
                  {section.items.map((item, j) => (
                    <TableRow
                      className={clsx({ colored: !!item.color })}
                      key={j}
                    >
                      <TableCell
                        scope="col"
                        sx={{
                          backgroundColor: item.color,
                          textAlign: "center",
                        }}
                      >
                        {insertNumberIcons(item.heading)}
                      </TableCell>
                      <TableCell>{item.text}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const getChart = (chart) => {
    // TODO: simplify
    if (!chart) return null;

    const { type, chartId, name, hiddenUntilExpand, sourceName, sourceLink } =
      chart;

    if (hiddenUntilExpand && !dashExpanded) return null;

    const source = sourceName && sourceLink && (
      <Typography variant="body">
        Source:{" "}
        <Link target="_blank" rel="noopener noreferrer" href={sourceLink}>
          {sourceName}
        </Link>
      </Typography>
    );

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

      const url = _.get(country, element.elementId);
      // console.log(chart);
      if (!url) return null;
      return (
        <Box
          sx={{
            display: "block",
            width: "100%",
            pt: 1,
            pb: 1,
            pl: 3,
          }}
        >
          <Link target="_blank" rel="noopener noreferrer" href={url}>
            {element.text}
          </Link>
        </Box>
      );
    }

    if (type === "html") {
      // for clarity...
      const element = chart;

      return (
        <Box
          sx={{
            display: "block",
            width: "100%",
            // pt: 1,
            // pb: 2,
            pl: 3,
          }}
        >
          <Typography
            sx={{
              "& > *": { mb: 0 },
            }}
            dangerouslySetInnerHTML={{
              __html: element.text,
            }}
          />
        </Box>
      );
    }

    if (chartId === "intro") {
      return (
        <Box
          sx={{
            // background: { xs: "red", sm: "blue", md: "green", lg: "yellow", xl: "purple" },
            // #NFS - designate intro section width to make room for boxes
            flexBasis: { xs: "100%", md: 290, lg: 400, xl: 425 },
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

    if (type === "text") {
      return (
        <Box
          sx={{
            pl: 3,
            width: "100%",
            "& dl": { display: "flex" },
          }}
        >
          {chart.elements.map((elem) => {
            return (
              <dl key={elem}>
                <dt>
                  <Typography variant="body" sx={{ fontWeight: "bold" }}>
                    {_.get(
                      chart,
                      ["textValues", `${elem}_row`, G.DISPLAY_NAME],
                      ""
                    )}
                    :
                  </Typography>
                </dt>
                <dd>
                  <Typography variant="body">
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
      );
    }

    if (type === "table" || type === "table_list") {
      // table has no data, skip
      if (!chart.data[0]) return null;
      return (
        <Box
          sx={{
            flexBasis: "100%", // never display on same line
            "& table": {
              maxWidth: 904, // approx width of intro/p95 on md
            },
            p: 3,
            height: "100%",
            overflowX: "auto",
          }}
          key={chartId}
        >
          <Typography variant="h5" component="h3">
            {name}
          </Typography>
          {getLegend(chart)}
          {source}
          {getTable(chart)}
        </Box>
      );
    }

    if (type === "nested") {
      return (
        <>
          <Box
            sx={{
              // see #NFS
              flexBasis: { xs: "100%", md: 580 },
              flexGrow: { md: 1 },
              flexShrink: { md: 1 },
              mr: "auto",
              ml: { xl: "auto" },
              maxWidth: { xs: 450, sm: 750 }, // vertical orientation on xs
              pt: { md: 3 },
              pl: 3,
            }}
            key={chartId}
          >
            <Typography
              sx={{ pb: { xl: 3 }, pr: 3 }}
              variant="h5"
              component="h3"
            >
              {name}
            </Typography>
            {source}
            {getNested(chart)}
          </Box>
          <Box sx={{ flexBasis: "100%", height: 0 }} />
        </>
      );
    }

    // if (chart.type === "area") return getAreaChart(chart);
    if (!type || !["line", "area"].includes(type)) {
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
        {getLegend(chart)}
        {source}
        {getLineAreaChart(chart)}
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
      {/* TODO: add key */}
      {chartData.map((cd, i) => (
        <>
          {/* {getLegend(cd)} */}
          {getChart(cd)}
        </>
      ))}
    </Box>
  );
};
