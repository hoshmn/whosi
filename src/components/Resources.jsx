import React from "react";
import {
  Modal,
  Paper,
  Typography,
  Box,
  IconButton,
  useTheme,
  Link,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails as MuiAccordionDetails,
} from "@mui/material";
import { getRC, inactiveText, themePrimary } from "../consts/colors";
import { Close, ArrowForwardIosSharp } from "@mui/icons-material";
import { CMS_FIELDS as C, RESOURCE_FIELDS as R } from "../consts/data";
import { styled } from "@mui/system";
import { transformLink } from "../utils/display";

// TODO: spell out, move?
const filterTermsMap = {
  publications: [
    "authors/collaborators",
    "tags",
    "country",
    "region",
    "language",
    "type",
    "year",
  ],
  webinars: [
    "authors/collaborators",
    "tags",
    "country",
    "region",
    "language",
    "type",
    "year",
  ],
  events: [],
};

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharp sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

const Publication = (resource) => {
  const {
    [R.title]: title,
    [R.title_link]: title_link,
    [R.authors]: authors,
    [R.journal]: journal,
    [R.volume_page]: volume_page,
    [R.date]: date,
  } = resource;

  if (!title) return null;

  const Title = (
    <Typography
      variant="body1"
      dangerouslySetInnerHTML={{
        __html: title,
      }}
    />
  );
  const TitleComp = title_link ? (
    <Link href={title_link} target="__blank">
      {Title}
    </Link>
  ) : (
    Title
  );
  return (
    <Box mt={2}>
      {TitleComp}
      <Typography
        variant="body2"
        sx={{ fontWeight: "600" }}
        dangerouslySetInnerHTML={{
          __html: authors,
        }}
      />
      {journal && (
        <Typography
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: journal + ". ",
          }}
        />
      )}
      {volume_page && (
        <Typography
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: volume_page + ". ",
          }}
        />
      )}
      {date && (
        <Typography
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: date + ". ",
          }}
        />
      )}
    </Box>
  );
};

const Webinar = (resource) => {
  const {
    [R.title]: title,
    [R.authors]: authors,
    [R.description]: description,
    [R.date]: date,
  } = resource;

  if (!title) return null;

  const genericTitle = R.link_n_title;
  const genericLink = R.link_n;
  const Links = _.range(1, 20).map((i) => {
    const {
      [genericTitle.replace("{n}", i)]: title,
      [genericLink.replace("{n}", i)]: link,
    } = resource;
    if (!link) return null;

    return (
      <Link href={link} target="__blank" key={link}>
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{
            __html: title || link,
          }}
        />
      </Link>
    );
  });

  return (
    <Box mt={2}>
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: title,
        }}
      />
      <Typography
        variant="body2"
        sx={{ fontWeight: "600" }}
        dangerouslySetInnerHTML={{
          __html: authors,
        }}
      />
      {description && (
        <Typography
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: description + ". ",
          }}
        />
      )}
      {date && (
        <Typography
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: date + ". ",
          }}
        />
      )}
      {Links}
    </Box>
  );
};

const Event = (resource) => {
  const {
    [R.title]: title,
    [R.authors]: authors,
    [R.description]: description,
    [R.date]: date,
  } = resource;

  if (!title) return null;

  const genericTitle = R.link_n_title;
  const genericLink = R.link_n;
  const Links = _.range(1, 20).map((i) => {
    const {
      [genericTitle.replace("{n}", i)]: title,
      [genericLink.replace("{n}", i)]: link,
    } = resource;
    if (!link) return null;

    return (
      <Link href={link} target="__blank" key={link}>
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{
            __html: title || link,
          }}
        />
      </Link>
    );
  });

  return (
    <Box mt={2}>
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: title,
        }}
      />
      <Typography
        variant="body2"
        sx={{ fontWeight: "600" }}
        dangerouslySetInnerHTML={{
          __html: authors,
        }}
      />
      {description && (
        <Typography
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: description + ". ",
          }}
        />
      )}
      {date && (
        <Typography
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: date + ". ",
          }}
        />
      )}
      {Links}
    </Box>
  );
};

export const Resources = ({
  open,
  close,
  publications,
  webinars,
  events,
  resourceNameMap,
  siteCopy,
  homeCopy = [],
}) => {
  const [filterSelections, setFilterSelections] = React.useState({});
  const [resourceType, setResourceType] = React.useState("publications");
  const [viewingFilters, setViewingFilters] = React.useState(false);
  const toggleViewingFilters = () => setViewingFilters(!viewingFilters);

  const RNM = React.useMemo(() => {
    return resourceNameMap.reduce((accum, row) => {
      if (row.id && row.name) accum[row.id] = row.name;
      return accum;
    }, {});
  }, [resourceNameMap]);

  const resourceData = React.useMemo(() => {
    const rMap = {
      publications,
      webinars,
      events,
    };
    return rMap[resourceType];
  }, [resourceType, publications.length, webinars.length, events.length]);

  const filterTerms = React.useMemo(() => {
    return filterTermsMap[resourceType];
  }, [resourceType]);

  const ResourceComponent = React.useMemo(() => {
    const rMap = {
      publications: Publication,
      webinars: Webinar,
      events: Event,
    };
    return rMap[resourceType];
  }, [resourceType]);

  const filterOptions = React.useMemo(() => {
    const result = {};
    filterTerms.forEach((term) => {
      resourceData.forEach((resource) => {
        if (resource[term]) {
          const newTerms = resource[term].split(",").map(_.trim);
          const allTerms = result[term] || [];
          result[term] = _.chain([...allTerms, ...newTerms])
            .uniq()
            .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
            .value();
        }
      });
    });
    // console.log("******", result);
    return result;
  }, [filterTerms, resourceData]);

  const filteredData = React.useMemo(() => {
    // if (_.isEmpty(filterSelections)) return resourceData;
    return resourceData.filter((d) => {
      return _.every(filterSelections, (values, key) => {
        // console.log(values, key, d[key]);
        return (
          !values.length || _.some(values, (v) => d[key] && d[key].includes(v))
        );
      });
    });
  }, [filterSelections, resourceData]);

  const handleFilterChange = (term, e, selections) => {
    // console.log(term,b,c, d,e,f)
    const newSel = _.cloneDeep(filterSelections);
    newSel[term] = selections;
    setFilterSelections(newSel);
  };

  const handleTypeChange = (event) =>
    setResourceType(event.target.value.toLowerCase());

  const clearFilters = (e) => {
    e.stopPropagation(); // don't toggle accordion
    setFilterSelections({});
  };

  const getHighlightedSection = () => {
    const highlighted = resourceData.filter((d) => d[R.highlighted]);
    if (!highlighted.length) return;
    return (
      <Box className="highlighted-section">
        <Typography
          // component="h3"
          variant="h3"
          // className="highlighted-description"
          dangerouslySetInnerHTML={{
            __html: siteCopy[`${C.highlighted_desc_}${resourceType}`].value,
          }}
        />
        {highlighted.map((resource, i) => (
          <ResourceComponent key={i} {...resource} />
        ))}
      </Box>
    );
  };

  const getFilterSection = () => {
    if (!filterTerms.length) return;
    // const isFiltered = filteredData.length !== resourceData.length;
    const text = `showing ${filteredData.length} of ${resourceData.length} items`;

    return (
      <>
        <Accordion
          disableGutters
          expanded={viewingFilters}
          onChange={toggleViewingFilters}
        >
          <AccordionSummary
            className={filtered ? "filtered" : ""}
            aria-controls="panel1d-content"
            id="panel1d-header"
          >
            <Typography variant="body1">
              Filters
              {filtered && (
                <>
                  {" "}
                  (
                  <Link href={null} onClick={clearFilters}>
                    clear
                  </Link>
                  )
                </>
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {filterTerms.map((term) => {
              const options = filterOptions[term] || [];
              // console.log(options);
              return (
                <Autocomplete
                  key={term}
                  multiple
                  disableCloseOnSelect
                  value={filterSelections[term] || []}
                  onChange={handleFilterChange.bind(null, term)}
                  id="tags-outlined"
                  options={options}
                  getOptionLabel={(option) => RNM[option] || option}
                  filterSelectedOptions
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={term}
                      // placeholder={t}
                    />
                  )}
                />
              );
            })}
          </AccordionDetails>
        </Accordion>
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{
            __html: text,
          }}
        />
      </>
    );
  };

  const theme = useTheme();
  const filtered = _.some(filterSelections, (val) => !!val.length);
  return (
    <Modal
      open={open}
      onBackdropClick={close}
      sx={{
        p: 1,
        py: { md: 2 },
        maxWidth: { xs: 700, md: 800, lg: 930 },
        m: "auto",
        "& .MuiPaper-root": {
          height: "100%",
          overflow: "auto",
        },
        "& .highlighted-section": {
          p: { xs: 1, sm: 2, md: 3 },
          my: 2,
          // border: { sm: `2px solid ${getRC(themePrimary, 11)}` },
          border: `1px solid ${getRC(themePrimary, 11)}`,
          borderWidth: { sm: 2 },
          background: getRC(themePrimary, 2),
          // pr: { sm: 6, md: 7 },
          // px: { lg: 8 },
          //   "& .highlighted-description": {
          //     fontWeight: '500',
          // },
        },
        "& .contents": {
          p: { xs: 2, sm: 4, md: 6 },
          pr: { sm: 6, md: 7 },
          px: { lg: 8 },
          position: "relative",
        },
        "& .close-button": {
          position: "absolute",
          zIndex: 10,
          right: { xs: theme.spacing(3), md: theme.spacing(4) },
          top: {
            xs: theme.spacing(3),
            sm: theme.spacing(4),
            md: theme.spacing(6),
          },
          background: "rgba(250,250,250,.8)",
          "&:hover": {
            background: "rgba(240,240,240,.9)",
          },
        },
        "& .MuiToggleButton-root": {
          // height: '30px'
          // mb: 3,
          "&.Mui-selected": {
            background: getRC(themePrimary, 2),
            color: getRC(themePrimary, 11),
            border: `1px ${getRC(themePrimary, 11)} solid !important`,
            // ml: "-2px"
          },
        },
        "& .MuiAccordion-root": {
          boxShadow: "none",
        },
        "& .MuiAccordionSummary-root": {
          background: "none",
          p: 0,
          "&:not(.filtered)": {
            color: inactiveText,
          },
          "&.filtered": {
            // color: getRC(themePrimary, 11),
          },
        },
        "& .MuiAutocomplete-root": {
          py: 0.5,
          maxWidth: 520,
        },
      }}
    >
      <Paper>
        <IconButton onClick={close} className="close-button">
          <Close />
        </IconButton>
        <Box className="contents">
          {/* <Typography variant="h6" component="h1">
            Resources
          </Typography> */}
          <Typography
            variant="h2"
            // component="h2"
            dangerouslySetInnerHTML={{
              __html: _.get(siteCopy, [C.resources_title, "value"]),
            }}
          />
          <Box my={2}>
            {homeCopy.map(
              (row, i) =>
                !!row[C.resources_intro] && (
                  <Typography
                    variant="body1"
                    key={i}
                    pb={1}
                    dangerouslySetInnerHTML={{
                      __html: transformLink(row[C.resources_intro]),
                    }}
                  />
                )
            )}
          </Box>

          <ToggleButtonGroup exclusive onChange={handleTypeChange}>
            {["Publications", "Webinars", "Events"].map((type) => (
              <ToggleButton
                selected={type.toLowerCase() === resourceType}
                value={type}
                key={type}
              >
                {type}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {getHighlightedSection(filteredData)}
          {getFilterSection()}

          {filteredData.map((resource, i) => (
            <ResourceComponent key={i} {...resource} />
          ))}
        </Box>
      </Paper>
    </Modal>
  );
};
