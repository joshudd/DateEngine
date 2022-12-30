import React from "react";
import { useState, useEffect } from "react";
import "../styles/Selections.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";

import Dropdown from "monday-ui-react-core/dist/Dropdown.js";
import Button from "monday-ui-react-core/dist/Button.js";

const monday = mondaySdk();

const Selections = () => {
  const [context, setContext] = useState();
  const [boardData, setBoardData] = useState();
  const [dateColumnOpts, setDateColumnOpts] = useState();
  const [numericColumnOpts, setNumericColumnOpts] = useState();

  useEffect(() => {
    monday.execute("valueCreatedForUser");

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
          setBoardData(res.data);
          console.log("query finish: ", res.data.boards);
          getOptions(res);
        });
    });
  }, []);

  const getOptions = (res) => {
    let dateArr = [];
    let numericArr = [];
    let options = res.data.boards[0].columns;
    console.log("source column array", options);
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

  const renderDropdowns = () => {
    return (
      <div className="dropdowns">
        <Dropdown
          className="sourceColumn"
          placeholder={"Select Date Source"}
          noOptionsMessage={() => "No date columns found in the board."}
          size={Dropdown.size.MEDIUM}
          options={dateColumnOpts}
          // onOptionSelect={(e) => this.setBoardSelect(e)}
          // onOptionSelect={function noRefCheck() {
          //   console.log("dropdown selected");
          // }}
        />

        <Dropdown
          className="numericColumn"
          placeholder={"Select Number Source"}
          noOptionsMessage={() => "No number columns found in the board."}
          size={Dropdown.size.MEDIUM}
          options={numericColumnOpts}
          // onOptionSelect={(e) => this.setSourceColumnSelect(e)}
        />

        <Dropdown
          className="targetColumn"
          placeholder={"Select Target Date"}
          noOptionsMessage={() => "No date columns found in the board."}
          size={Dropdown.size.MEDIUM}
          options={dateColumnOpts}
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
        <div className="button">
          <Button
            className="button-submit"
            size={Button.sizes.MEDIUM}
            color={Button.colors.PRIMARY}
            // onClick={() => {
            //   this.updateDate();
            // }}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Selections;
