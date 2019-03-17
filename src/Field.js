import React from "react";

const Field = ({ label, units = "", ...other }) => (
  <div className="field">
    <div>
      {label}: {units === "$" ? units : ""}
      <input type="number" {...other} />
      {units !== "$" ? units : ""}
    </div>
    <input type="range" {...other} />
  </div>
);

export default Field;
