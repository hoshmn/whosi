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
} from "@mui/material";
import { getRC, themePrimary } from "../consts/colors";
import { Close } from "@mui/icons-material";
import { RESOURCE_FIELDS } from "../consts/data";

// TODO: spell out, move?
const filterTerms = ["authors", "tags", "country", "region"];

const Publication = (p) => {
  const {
    [RESOURCE_FIELDS.title]: title,
    [RESOURCE_FIELDS.title_link]: title_link,
    [RESOURCE_FIELDS.authors]: authors,
    [RESOURCE_FIELDS.journal]: journal,
    [RESOURCE_FIELDS.volume_page]: volume_page,
  } = p;
  return (
    <Box mt={2}>
      <Link href={title_link}>
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
  console.log(publications);
  console.log(webinars);
  console.log(resourceNameMap);

  const RNM = React.useMemo(() => {
    return resourceNameMap.reduce((accum, row) => {
      if (row.id && row.name) accum[row.id] = row.name;
      return accum;
    }, {});
  }, [resourceNameMap]);
  
  const filterOptions = {};
  filterTerms.forEach((t) => {
    publications.forEach((d) => {
      if (d[t]) {
        const newTerms = d[t].split(",").map(_.trim);
        const allTerms = filterOptions[t] || [];
        filterOptions[t] = _.chain([...allTerms, ...newTerms])
          .uniq()
          .sort((a, b) => (a > b ? 1 : -1))
          .value();
      }
    });
  });

  const [filterSelections, setFilterSelections] = React.useState({});
  const handleChange = (term, e, selections) => {
    // console.log(term,b,c, d,e,f)
    const newSel = _.cloneDeep(filterSelections);
    newSel[term] = selections;
    setFilterSelections(newSel);
  };

  const filteredData = React.useMemo(() => {
    if (_.isEmpty(filterSelections)) return publications;
    return publications.filter((d) => {
      return _.every(filterSelections, (values, key) => {
        console.log(values, key, d[key]);
        return (
          !values.length || _.some(values, (v) => d[key] && d[key].includes(v))
        );
      });
    });
  }, [filterSelections]);

  const theme = useTheme();
  return (
    <Modal
      open={open}
      onBackdropClick={close}
      sx={{
        p: 1,
        "& .MuiPaper-root": {
          height: "100%",
          overflow: "auto",
        },
        "& .contents": {
          p: 4,
          pr: 6,
          position: "relative",
        },
        // "& .MuiButtonBase-root": 
      }}
    >
      <Paper>
        <IconButton onClick={close} sx={{
          position: "absolute",
          zIndex: 10,
          right: theme.spacing(4),
          top: theme.spacing(4),
        }}>
          {/* ✕ */}
          <Close />
        </IconButton>
        <Box className="contents">
          <Typography variant="h6" component="h1">
            Resources
            {/* <ToggleButtonGroup>
          
            <ToggleButton />
            </ToggleButtonGroup> */}
            {filterTerms.map((term) => {
              const options = filterOptions[term] || [];
              // console.log(options);
              return (
                <Autocomplete
                  key={term}
                  sx={{ py: 0.5 }}
                  multiple
                  value={filterSelections[term] || []}
                  onChange={handleChange.bind(null, term)}
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
                  // className={classes.autocomplete}
                  // multiple/
                  // onChange={_.noop}
                  // renderTags={(tag) => tag + "1"}
                  // renderOption={(option) => option.key}
                />
              );
            })}
            {filteredData.map((p) => (
              <Publication {...p} />
            ))}
          </Typography>
        </Box>
      </Paper>
    </Modal>
  );
};
