import React from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css";
//Explore more Monday React Components here: https://style.monday.com/
import Dropdown from "monday-ui-react-core/dist/Dropdown.js";
import TextField from "monday-ui-react-core/dist/TextField.js";
import Button from "monday-ui-react-core/dist/Button.js";

const monday = mondaySdk();

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      context: {},

      // sets prompts on ui
      searchOptions: {
        boardPrompt: "Board",
        targetColumnPrompt: "Target column",
        sourceColumnPrompt: "Source column",
        itemPrompt: "Item",
        datePrompt: "# of days",
      },

      // holds selection data from ui
      boardSelect: "",
      sourceColumnSelect: "",
      targetColumnSelect: "",
      itemSelect: "",
      valueSelect: "",
      origDateValue: "",
      finalDateValue: "",

      // holds option data get options methods
      boardOptions: [],
      columnOptions: [],
      itemOptions: [],

      // holds all data from original query
      boardData: {},
    };
  }

  componentDidMount() {
    // TODO: set up event listeners

    // listens to changes in settings and sends to getSettings
    monday.listen("settings", (res) => {
      this.setState({ settings: res.data });
      console.log("settings listen", this.state.settings);
      // {"fieldName": "fieldValue", "fieldName2": "fieldValue2"...}
    });

    // listens to context
    monday.listen("context", (res) => {
      this.setState({ context: res.data });
      console.log("context listen", res.data);
      this.getUIoptions();
    });
  }

  // gets the necessary info from server and calls get options functions
  getUIoptions = () => {
    console.log("getUIoptions call");
    monday
      .api(
        "query ($boardIds: [Int]) { boards (ids:$boardIds) { name id columns { id title type } items { id name } } }",
        {
          variables: { boardIds: this.state.context.boardIds },
        }
      )
      .then((res) => {
        this.setState({ boardData: res.data });
        console.log("getUIoptions query finish: ", res.data);
        this.getBoardOptions();
        this.getColumnOptions();
        this.getItemOptions();
      });
  };

  /* info getting functions */

  // get the board dropdown options
  getBoardOptions = () => {
    console.log("getBoardOptions call");
    const options = this.state.boardData.boards;
    let arr = [];
    let boardLabel = "";
    let boardValue = "";

    for (let i = 0; i < options.length; i++) {
      boardLabel = options[i].name;
      boardValue = options[i].id;
      arr.push({ label: boardLabel, value: boardValue });
    }

    this.setState({
      boardOptions: arr,
    });

    console.log("boardopts check: ", this.state.boardOptions);
  };

  // get the column dropdown options
  getColumnOptions = () => {
    console.log("getColumnOptions call");
    const options = this.state.boardData.boards[0].columns;
    let arr = [];
    let columnLabel = "";
    let columnValue = "";

    for (let i = 0; i < options.length; i++) {
      columnLabel = options[i].title;
      // must stay object for type check
      columnValue = options[i];

      // add to array if the column is a date column
      if (columnValue.type === "date" || columnValue.type === "lookup") {
        arr.push({ label: columnLabel, value: columnValue.id });
      }
    }

    this.setState({
      columnOptions: arr,
    });

    console.log("columnopts check: ", this.state.columnOptions);
  };

  // get the item dropdown options
  getItemOptions = () => {
    console.log("getItemOptions call");
    const options = this.state.boardData.boards[0].items;
    let arr = [];
    let itemLabel = "";
    let itemValue = "";

    for (let i = 0; i < options.length; i++) {
      itemLabel = options[i].name;
      itemValue = options[i].id;
      arr.push({ label: itemLabel, value: itemValue });
    }

    this.setState({
      itemOptions: arr,
    });

    console.log("itemopts check: ", this.state.itemOptions);
  };

  // setters that get and set info from ui selections

  setBoardSelect(e) {
    this.setState({ boardSelect: e.value });
  }

  setSourceColumnSelect(e) {
    this.setState({ sourceColumnSelect: e.value });
  }

  setTargetColumnSelect(e) {
    this.setState({ targetColumnSelect: e.value });
  }

  setItemSelect(e) {
    this.setState({ itemSelect: e.value });
  }

  setValueSelect() {
    this.setState({
      valueSelect: document.getElementById("DateChanger").value,
    });
  }

  // functions for changing a date

  getOrigDate = () => {
    monday
      .api(
        "query ($boardID: [Int], $itemID: [Int], $columnID: [String]) { boards (ids:$boardID) { items (ids:$itemID) { column_values (ids:$columnID) { text } } } }",
        {
          variables: {
            boardID: parseInt(this.state.boardSelect),
            columnID: this.state.sourceColumnSelect,
            itemID: parseInt(this.state.itemSelect),
          },
        }
      )
      .then((res) => {
        const dateText = res.data.boards[0].items[0].column_values[0].text;
        this.setState({ origDateValue: dateText });
        console.log("getOrigDate ", this.state.origDateValue, dateText);
      });
  };

  // update button press
  updateAll = () => {
    console.log("update function call");
    this.getUIoptions();
    this.getOrigDate();
    this.setValueSelect();
    this.manipulateDate();
  };

  manipulateDate() {
    // set variables
    const numDays = parseInt(this.state.valueSelect);
    // yyyy-mm-dd
    const origDate = this.state.origDateValue;
    // convert to date object
    const origDateObj = new Date(this.state.origDateValue);
    // create final date object (default current date)
    const finalDateObj = new Date();

    // calculate final date
    finalDateObj.setDate(origDateObj.getDate() + numDays);

    // convert back to "yyyy-mm-dd"
    const finalDate = finalDateObj.toISOString().split("T")[0];

    // set the state value
    this.setState({ finalDateValue: finalDate });
    console.log("manipulate date call", origDate, finalDate);
  }

  updateDate = () => {
    monday.api(
      "mutation ($boardID: Int!, $itemID: Int!, $columnID: String!, $dateValue: JSON!) { change_column_value(board_id:$boardID, item_id: $itemID, column_id: $columnID, value: $dateValue) { id } }",
      {
        variables: {
          // dateValue: '{"date":"2022-07-02"}', // works
          dateValue: '{"date":"' + this.state.finalDateValue + '"}',
          boardID: parseInt(this.state.boardSelect),
          columnID: this.state.targetColumnSelect,
          itemID: parseInt(this.state.itemSelect),
        },
      }
    );
    console.log(
      "date updated",
      parseInt(this.state.boardSelect),
      this.state.targetColumnSelect,
      parseInt(this.state.itemSelect),
      this.state.finalDateValue
    );
  };

  // returns dropdown information
  renderBoardOptions() {
    return (
      <div>
        <div className="optionsField">
          <Dropdown
            placeholder={this.state.searchOptions.boardPrompt}
            noOptionsMessage={() => "hit update a few times"}
            size={Dropdown.size.MEDIUM}
            options={this.state.boardOptions}
            onOptionSelect={(e) => this.setBoardSelect(e)}
            // onOptionSelect={function noRefCheck() {
            //   console.log("dropdown selected");
            // }}
          />
        </div>
        <div className="optionsField">
          <Dropdown
            placeholder={this.state.searchOptions.sourceColumnPrompt}
            noOptionsMessage={() => "hit update a few times"}
            size={Dropdown.size.MEDIUM}
            options={this.state.columnOptions}
            onOptionSelect={(e) => this.setSourceColumnSelect(e)}
          />
        </div>
        <div className="optionsField">
          <Dropdown
            placeholder={this.state.searchOptions.targetColumnPrompt}
            noOptionsMessage={() => "hit update a few times"}
            size={Dropdown.size.MEDIUM}
            options={this.state.columnOptions}
            onOptionSelect={(e) => this.setTargetColumnSelect(e)}
          />
        </div>
        <div className="optionsField">
          <Dropdown
            placeholder={this.state.searchOptions.itemPrompt}
            noOptionsMessage={() => "hit update a few times"}
            size={Dropdown.size.MEDIUM}
            options={this.state.itemOptions}
            onOptionSelect={(e) => this.setItemSelect(e)}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="App">
        <div className="mainSection">
          <div className="header">
            <h1>enter info:</h1>
          </div>
          <div className="options">
            <div>{this.renderBoardOptions()}</div>
            <div className="optionsField">
              <TextField
                id="DateChanger"
                className="dateField"
                placeholder={this.state.searchOptions.datePrompt}
                size={TextField.sizes.MEDIUM}
                validation={{
                  text: "numbers only",
                  // status: "error",
                }}
                // iconName={CloseSmall} // not working?
              />
            </div>
            <div className="optionsField">
              <p className="directions">
                After entering info, please hit Update twice before Get Date.
              </p>
            </div>
            <div className="button">
              <Button
                className="button"
                size={Button.sizes.MEDIUM}
                color={Button.colors.POSITIVE}
                onClick={() => {
                  this.updateAll();
                }}
              >
                Update
              </Button>
              <Button
                size={Button.sizes.MEDIUM}
                color={Button.colors.PRIMARY}
                onClick={() => {
                  this.updateDate();
                }}
              >
                Get Date
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
