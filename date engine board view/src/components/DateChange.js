/**
 * @author Joshua Dickinson
 * @date January 1, 2023
 */

import React, { Component } from "react";

/**
 * Calculates a date
 * @param {string} inDate - input date in form "yyyy-mm-dd"
 * @param {int} range - number of days to adjust date by
 * @returns a string of the output date in form "yyyy-mm-dd"
 */
function manipulateDate(inDate, range) {
  // convert "yyyy-mm-dd" (column text) to date object
  inDate = new Date(inDate);

  // create final date object based on indate and range (convert to time)
  let outDate = new Date(inDate.getTime() + range * 86400000);

  // convert back to "yyyy-mm-dd"
  return outDate.toISOString().split("T")[0];
}

export { manipulateDate };
