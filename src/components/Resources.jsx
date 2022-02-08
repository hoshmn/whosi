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
import { RESOURCE_FIELDS } from "../consts/data";
import { styled } from "@mui/system";

// TODO: spell out, move?
const filterTermsMap = {
  publications: [
    "authors/collaborators",
    "tags",
    "country",
    "region",
    "language",
  ],
  webinars: ["authors/collaborators", "tags", "country", "region", "language"],
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
    [RESOURCE_FIELDS.title]: title,
    [RESOURCE_FIELDS.title_link]: title_link,
    [RESOURCE_FIELDS.authors]: authors,
    [RESOURCE_FIELDS.journal]: journal,
    [RESOURCE_FIELDS.volume_page]: volume_page,
    [RESOURCE_FIELDS.date]: date,
  } = resource;

  if (!title) return null;

  return (
    <Box mt={2}>
      <Link href={title_link} target="__blank">
        <Typography
          // mt={1}
          variant="body1"
          dangerouslySetInnerHTML={{
            __html: title,
          }}
        />
      </Link>
      <Typography
        // mt={1}
        variant="body2"
        sx={{ fontWeight: "bolder" }}
        dangerouslySetInnerHTML={{
          __html: authors,
        }}
      />
      {journal && (
        <Typography
          // mt={1}
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: journal + ". ",
          }}
        />
      )}
      {volume_page && (
        <Typography
          // mt={1}
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: volume_page + ". ",
          }}
        />
      )}
      {date && (
        <Typography
          // mt={1}
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
    [RESOURCE_FIELDS.title]: title,
    [RESOURCE_FIELDS.authors]: authors,
    [RESOURCE_FIELDS.description]: description,
    [RESOURCE_FIELDS.date]: date,
  } = resource;

  if (!title) return null;

  const Links = _.range(1, 10).map((i) => {
    const lString = `link_${i}`;
    const tString = `link_${i}_title`;
    const {
      [RESOURCE_FIELDS[tString]]: title,
      [RESOURCE_FIELDS[lString]]: link,
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
        // mt={1}
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: title,
        }}
      />
      <Typography
        // mt={1}
        variant="body2"
        sx={{ fontWeight: "bolder" }}
        dangerouslySetInnerHTML={{
          __html: authors,
        }}
      />
      {description && (
        <Typography
          // mt={1}
          variant="body2"
          sx={{ display: "inline" }}
          dangerouslySetInnerHTML={{
            __html: description + ". ",
          }}
        />
      )}
      {date && (
        <Typography
          // mt={1}
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
  resourceNameMap,
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
    };
    return rMap[resourceType];
  }, [resourceType, publications.length, webinars.length]);

  const filterTerms = React.useMemo(() => {
    return filterTermsMap[resourceType];
  }, [resourceType]);

  const ResourceComponent = React.useMemo(() => {
    const rMap = {
      publications: Publication,
      webinars: Webinar,
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
            .sort((a, b) => (a > b ? 1 : -1))
            .value();
        }
      });
    });
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

  const theme = useTheme();
  const filtered = _.some(filterSelections, (val) => !!val.length);
  return (
    <Modal
      open={open}
      onBackdropClick={close}
      sx={{
        p: 1,
        maxWidth: { xs: 700, md: 800, lg: 930 },
        m: "auto",
        "& .MuiPaper-root": {
          height: "100%",
          overflow: "auto",
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
          top: { xs: theme.spacing(3), sm: theme.spacing(4), md: theme.spacing(6) },
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
            borderColor: getRC(themePrimary, 11),
            borderWidth: 1,
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

          <ToggleButtonGroup exclusive onChange={handleTypeChange}>
            {["Publications", "Webinars"].map((type) => (
              <ToggleButton
                selected={type.toLowerCase() === resourceType}
                value={type}
                key={type}
              >
                {type}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

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
              <Typography variant="body1" component="body1">
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
                    sx={{ py: 0.5 }}
                    multiple
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

          {filteredData.map((resource, i) => (
            <ResourceComponent key={i} {...resource} />
          ))}
        </Box>
      </Paper>
    </Modal>
  );
};
