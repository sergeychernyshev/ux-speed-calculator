import React from "react";

const Field = ({ label, units = "", ...other }) => {
  const { min, max, step, value, onChange } = other;

  const inputProps = { label, min, max, step, value, onChange };

  return (
    <div className="field">
      <label>
        {label}: {units === "$" ? units : ""}
        <input type="number" {...inputProps} />
        {units !== "$" ? units : ""}
      </label>
      <input type="range" {...inputProps} />
    </div>
  );
};

export default Field;
