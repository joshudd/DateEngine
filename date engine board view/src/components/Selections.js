/**
 * @author Joshua Dickinson
 * @date January 1, 2023
 */

import React from "react";
import { useState, useEffect } from "react";
import "../styles/Selections.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
import { manipulateDate } from "./DateChange";

import Dropdown from "monday-ui-react-core/dist/Dropdown.js";
import Checkbox from "monday-ui-react-core/dist/Checkbox.js";
import Button from "monday-ui-react-core/dist/Button.js";

const monday = mondaySdk();

/**
 * Queries and manipulates date data from a monday board based on selected columns
 */
const Selections = () => {
  const [context, setContext] = useState();
  const [boardData, setBoardData] = useState();
  const [dateColumnOpts, setDateColumnOpts] = useState();
  const [numericColumnOpts, setNumericColumnOpts] = useState();
  const [selections, setSelections] = useState([null, null, null]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    monday.execute("valueCreatedForUser");

    // listen to context changes
    monday.listen("context", (res) => {
      setContext(res.data);
      console.log(res.data);
      // get board data and assign state value
      monday
        .api(
          "query ($boardIds: [Int]) { boards (ids:$boardIds) { name id columns { id title type } items { id name } } }",
          {
            variables: { boardIds: res.data.boardIds },
          }
        )
        .then((res) => {
          setBoardData(res.data.boards[0]);
          console.log("query finish", res.data.boards);
          getOptions(res);
        });
    });
  }, []);

  /**
   * Gathers possible columns of type "date" & type "numeric"
   * @param {Object} res - board infomation
   */
  const getOptions = (res) => {
    let dateArr = [];
    let numericArr = [];
    let options = res.data.boards[0].columns;

    for (let i = 0; i < options.length; i++) {
      // type "lookup" for mirror support
      if (options[i].type === "date" || options[i].type === "lookup") {
        dateArr.push({ label: options[i].title, value: options[i].id });
      } else if (
        options[i].type === "numeric" ||
        options[i].type === "lookup"
      ) {
        numericArr.push({ label: options[i].title, value: options[i].id });
      }
    }
    setDateColumnOpts(dateArr);
    setNumericColumnOpts(numericArr);
  };

  /**
   * Mutates monday board based on dropdown selection values
   */
  const updateDates = () => {
    console.log("submit press", selections);
    // for each item in board
    for (let i = 0; i < boardData.items.length; i++) {
      // get source date
      monday
        .api(
          "query ($boardID: [Int], $itemID: [Int], $columnID: [String]) { boards (ids:$boardID) { items (ids:$itemID) { column_values (ids:$columnID) { text } } } }",
          {
            variables: {
              boardID: parseInt(boardData.id),
              columnID: [selections[0].value, selections[1].value],
              itemID: parseInt(boardData.items[i].id),
            },
          }
        )
        .then((res) => {
          let date = res.data.boards[0].items[0].column_values[0].text;
          let range = parseInt(
            res.data.boards[0].items[0].column_values[1].text
          );

          // if reverse direction, make range negative
          if (checked) {
            range *= -1;
          }

          if (date != "" && range != null) {
            monday.api(
              "mutation ($boardID: Int!, $itemID: Int!, $columnID: String!, $dateValue: JSON!) { change_column_value(board_id:$boardID, item_id: $itemID, column_id: $columnID, value: $dateValue) { id } }",
              {
                variables: {
                  // dateValue: '{"date":"2022-07-02"}', // works
                  dateValue: '{"date":"' + manipulateDate(date, range) + '"}',
                  boardID: parseInt(boardData.id),
                  columnID: selections[2].value,
                  itemID: parseInt(boardData.items[i].id),
                },
              }
            );
          }
        });
    }
  };

  /**
   * renders the dropdown components
   */
  const renderDropdowns = () => {
    return (
      <div className="dropdowns">
        <Dropdown
          className="sourceColumn"
          placeholder={"Date Source"}
          noOptionsMessage={() => "No date columns found in the board."}
          size={Dropdown.size.MEDIUM}
          options={dateColumnOpts}
          // onOptionSelect={(e) => this.setBoardSelect(e)}
          onOptionSelect={function Selected(selection) {
            console.log("dropdown selected", selection);
            setSelections([selection, selections[1], selections[2]]);
          }}
        />

        <Dropdown
          className="numericColumn"
          placeholder={"Number Source"}
          noOptionsMessage={() => "No number columns found in the board."}
          size={Dropdown.size.MEDIUM}
          options={numericColumnOpts}
          onOptionSelect={function Selected(selection) {
            console.log("dropdown selected", selection);
            setSelections([selections[0], selection, selections[2]]);
          }}
          // onOptionSelect={(e) => this.setSourceColumnSelect(e)}
        />

        <Dropdown
          className="targetColumn"
          placeholder={"Target Date"}
          noOptionsMessage={() => "No date columns found in the board."}
          size={Dropdown.size.MEDIUM}
          options={dateColumnOpts}
          onOptionSelect={function Selected(selection) {
            console.log("dropdown selected", selection);
            setSelections([selections[0], selections[1], selection]);
          }}
          // onOptionSelect={(e) => this.setTargetColumnSelect(e)}
        />
      </div>
    );
  };

  return (
    <div id="selections">
      <div className="header">
        <h1>Enter Info</h1>
      </div>
      <div className="content">
        {renderDropdowns()}
        <div>
          <Checkbox
            default
            label="Reverse Direction"
            onChange={function Check() {
              setChecked(!checked);
            }}
          />
        </div>
        <div className="button">
          <Button
            className="button-submit"
            size={Button.sizes.MEDIUM}
            color={Button.colors.PRIMARY}
            onClick={() => {
              updateDates();
            }}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Selections;
