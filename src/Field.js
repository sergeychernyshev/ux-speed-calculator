import React from "react";

const Field = ({ label, description, units = "", ...other }) => {
  const { min, max, step, value, onChange } = other;

  const inputProps = { label, min, max, step, value, onChange };

  return (
    <div className="field">
      <label title={description}>
        {label}: {units === "$" ? units : ""}
        <input type="number" {...inputProps} />
        {units !== "$" ? units : ""}
      </label>
      <input type="range" {...inputProps} />
    </div>
  );
};

export default Field;
